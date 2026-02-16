from flask import Flask, request, jsonify
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
import numpy as np

app = Flask(__name__)
CORS(app)


@app.route('/predict', methods=['POST'])
def predict():
    """
    Receives an array of data points and predicts the next 3 future values
    using Linear Regression.
    """
    try:
        body = request.get_json()
        data_points = body.get('data', [])

        if len(data_points) < 2:
            return jsonify({
                'error': 'Need at least 2 data points to make a prediction'
            }), 400

        values = [point['value'] for point in data_points]
        X = np.arange(len(values)).reshape(-1, 1)
        y = np.array(values, dtype=float)

        model = LinearRegression()
        model.fit(X, y)

        future_X = np.arange(len(values), len(values) + 3).reshape(-1, 1)
        predictions = model.predict(future_X)
        score = model.score(X, y)

        result = {
            'predictions': [
                {
                    'label': f'Prediction {i + 1}',
                    'value': round(float(pred), 2),
                    'index': len(values) + i
                }
                for i, pred in enumerate(predictions)
            ],
            'model': {
                'type': 'Linear Regression',
                'accuracy': round(float(score * 100), 2),
                'slope': round(float(model.coef_[0]), 2),
                'intercept': round(float(model.intercept_), 2)
            }
        }

        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/insights', methods=['POST'])
def insights():
    """
    Receives data grouped by category and returns text-based AI insights
    analyzing trends, changes, and predictions for each category.

    Expected JSON body:
    {
        "categories": {
            "Revenue": [{ "value": 100, "label": "Jan", "date": "..." }, ...],
            "Sales": [...]
        }
    }
    """
    try:
        body = request.get_json()
        categories_data = body.get('categories', {})
        insights_list = []

        for cat_name, entries in categories_data.items():
            if len(entries) < 2:
                insights_list.append({
                    'category': cat_name,
                    'trend': 'neutral',
                    'change_pct': 0,
                    'message': f'{cat_name} has too few entries for analysis. Add more data.',
                    'prediction': None
                })
                continue

            values = [e['value'] for e in entries]
            n = len(values)

            # Calculate recent change (last entry vs previous)
            recent_change = values[-1] - values[-2]
            change_pct = round((recent_change / max(abs(values[-2]), 1)) * 100, 1)

            # Overall trend via linear regression
            X = np.arange(n).reshape(-1, 1)
            y = np.array(values, dtype=float)
            model = LinearRegression()
            model.fit(X, y)
            slope = float(model.coef_[0])

            # Predict next value
            next_val = round(float(model.predict([[n]])[0]), 2)

            # Determine trend
            if slope > 0.5:
                trend = 'up'
            elif slope < -0.5:
                trend = 'down'
            else:
                trend = 'stable'

            # Generate human-readable message
            avg_val = round(float(np.mean(values)), 1)
            max_val = round(float(np.max(values)), 1)
            min_val = round(float(np.min(values)), 1)

            if trend == 'up':
                if change_pct > 10:
                    message = f'🚀 {cat_name} is surging! Up {change_pct}% recently. Predicted next value: {next_val}.'
                else:
                    message = f'📈 {cat_name} is growing steadily (+{change_pct}%). Next predicted: {next_val}.'
            elif trend == 'down':
                if change_pct < -10:
                    message = f'⚠️ Warning: {cat_name} dropped {abs(change_pct)}% recently. Predicted next: {next_val}. Consider taking action.'
                else:
                    message = f'📉 {cat_name} is slightly declining ({change_pct}%). Next predicted: {next_val}.'
            else:
                message = f'➡️ {cat_name} is stable (avg: {avg_val}). Range: {min_val} – {max_val}. Next predicted: {next_val}.'

            insights_list.append({
                'category': cat_name,
                'trend': trend,
                'change_pct': change_pct,
                'message': message,
                'prediction': next_val,
                'stats': {
                    'avg': avg_val,
                    'max': max_val,
                    'min': min_val,
                    'entries': n
                }
            })

        return jsonify({'insights': insights_list}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/correlations', methods=['POST'])
def correlations():
    """
    Analyzes cross-category correlations.
    Takes category data and computes how changes in one category
    relate to changes in others (e.g., Users ↑ → Revenue ↑).
    """
    try:
        body = request.get_json()
        categories_data = body.get('categories', {})

        cat_names = list(categories_data.keys())
        if len(cat_names) < 2:
            return jsonify({'correlations': [], 'message': 'Need at least 2 categories to find correlations'}), 200

        # Build value arrays per category (use average per entry index)
        cat_values = {}
        for cat_name, entries in categories_data.items():
            if len(entries) >= 2:
                vals = [float(e['value']) for e in entries]
                cat_values[cat_name] = vals

        results = []
        processed = set()

        for cat_a in cat_values:
            for cat_b in cat_values:
                if cat_a == cat_b:
                    continue
                pair_key = tuple(sorted([cat_a, cat_b]))
                if pair_key in processed:
                    continue
                processed.add(pair_key)

                vals_a = cat_values[cat_a]
                vals_b = cat_values[cat_b]

                # Align lengths
                min_len = min(len(vals_a), len(vals_b))
                if min_len < 2:
                    continue

                a = np.array(vals_a[:min_len], dtype=float)
                b = np.array(vals_b[:min_len], dtype=float)

                # Pearson correlation
                if np.std(a) == 0 or np.std(b) == 0:
                    continue

                corr = float(np.corrcoef(a, b)[0, 1])

                # Compute slope: how much does B change per unit of A?
                model = LinearRegression()
                model.fit(a.reshape(-1, 1), b)
                slope = float(model.coef_[0])

                # Calculate descriptive impact
                avg_a = float(np.mean(a))
                avg_b = float(np.mean(b))

                if avg_a == 0:
                    continue

                # "If A increases by 10%, B increases by X%"
                a_change_pct = 10
                a_change_abs = avg_a * (a_change_pct / 100)
                b_change_abs = a_change_abs * slope
                b_change_pct = round((b_change_abs / max(abs(avg_b), 1)) * 100, 1)

                strength = 'strong' if abs(corr) > 0.7 else 'moderate' if abs(corr) > 0.4 else 'weak'
                direction = 'positive' if corr > 0 else 'negative'

                # Generate message
                if abs(corr) >= 0.3:
                    arrow_a = '↑' if b_change_pct >= 0 else '↑'
                    arrow_b = '↑' if b_change_pct >= 0 else '↓'

                    if corr > 0:
                        message = f"When {cat_a} {arrow_a}10%, {cat_b} tends to {arrow_b}{abs(b_change_pct)}%"
                    else:
                        message = f"When {cat_a} ↑10%, {cat_b} tends to ↓{abs(b_change_pct)}%"

                    results.append({
                        'from': cat_a,
                        'to': cat_b,
                        'correlation': round(corr, 3),
                        'strength': strength,
                        'direction': direction,
                        'impact_pct': b_change_pct,
                        'message': message
                    })

        # Sort by correlation strength
        results.sort(key=lambda x: abs(x['correlation']), reverse=True)

        return jsonify({'correlations': results}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/simulate', methods=['POST'])
def simulate():
    """
    Receives data points and a growth multiplier, returns original predictions
    alongside multiplied projected predictions for What-If analysis.
    """
    try:
        body = request.get_json()
        data_points = body.get('data', [])
        multiplier = float(body.get('multiplier', 1.0))

        if len(data_points) < 2:
            return jsonify({'error': 'Need at least 2 data points'}), 400

        values = [point['value'] for point in data_points]
        X = np.arange(len(values)).reshape(-1, 1)
        y = np.array(values, dtype=float)

        model = LinearRegression()
        model.fit(X, y)

        future_X = np.arange(len(values), len(values) + 3).reshape(-1, 1)
        base_predictions = model.predict(future_X)

        result = {
            'original': [
                {'label': f'Prediction {i+1}', 'value': round(float(p), 2), 'index': len(values) + i}
                for i, p in enumerate(base_predictions)
            ],
            'projected': [
                {'label': f'Prediction {i+1}', 'value': round(float(p * multiplier), 2), 'index': len(values) + i}
                for i, p in enumerate(base_predictions)
            ],
            'multiplier': multiplier,
            'model': {
                'type': 'Linear Regression',
                'accuracy': round(float(model.score(X, y) * 100), 2),
                'slope': round(float(model.coef_[0]), 2)
            }
        }
        return jsonify(result), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'SmartDash AI Engine'}), 200


if __name__ == '__main__':
    import os
    port = int(os.environ.get('PORT', 5001))
    print(f"🧠 AI Engine running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=False)
