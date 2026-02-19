from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from sklearn.linear_model import LinearRegression
import numpy as np
import pandas as pd
import io
import os
from pypdf import PdfReader
from datetime import datetime
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
import re

app = Flask(__name__)
# Configure CORS
cols_origin = os.environ.get('CORS_ORIGIN', '*')
CORS(app, resources={r"/*": {"origins": cols_origin}})

# Ensure models directory exists
MODELS_DIR = os.path.join(os.getcwd(), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

def parse_file_content(file_stream, filename):
    """
    Parses PDF or TXT content to extract numerical data points.
    Expected format: one number per line OR date,number pairs.
    Returns a list of dictionaries: [{'label': 'Entry 1', 'value': 123.4}, ...]
    """
    text = ""
    try:
        if filename.lower().endswith('.pdf'):
            reader = PdfReader(file_stream)
            for page in reader.pages:
                text += page.extract_text() + "\n"
        else:
            # Assume text based
            text = file_stream.read().decode('utf-8')
    except Exception as e:
        raise ValueError(f"Failed to parse file: {str(e)}")

    # Extract all numbers from the text
    # Strategy: look for lines with numbers.
    # Simple regex to find numbers (int or float)
    # If a line has a date and a number, use the date as label?
    # For MVP: just extract all numbers found in sequence.
    
    data_points = []
    lines = text.split('\n')
    counter = 1
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Regex to find the last number in the line (assuming "Date: Value" format)
        # Matches 123, 123.45, -123.45
        matches = re.findall(r'[-+]?\d*\.\d+|\d+', line)
        if matches:
            # Take the last number as the value
            try:
                val = float(matches[-1])
                # Try to find a label (everything before the number)
                # Or just use "Entry X"
                label = f"Entry {counter}"
                
                # If the line starts with something that looks like a date/label
                # (simple heuristic: first part of line)
                parts = line.split()
                if len(parts) > 1:
                    # Join parts except the last one (which is likely the value)
                    possible_label = " ".join(parts[:-1]).strip()
                    # Clean up label (remove trailing colon etc)
                    possible_label = possible_label.rstrip(':,')
                    if len(possible_label) < 30: # Reasonable label length
                        label = possible_label
                
                data_points.append({'label': label, 'value': val})
                counter += 1
            except ValueError:
                continue
                
    if not data_points:
        raise ValueError("No valid numerical data found in file")
        
    return data_points


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

        # Generating future predictions
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

        # Generate Global Summary
        if insights_list:
            up_trends = [i for i in insights_list if i['trend'] == 'up']
            down_trends = [i for i in insights_list if i['trend'] == 'down']
            stable_trends = [i for i in insights_list if i['trend'] == 'stable']
            
            summary_parts = []
            if len(up_trends) > len(down_trends):
                summary_parts.append("Overall performance is positive.")
            elif len(down_trends) > len(up_trends):
                summary_parts.append("Performance is trending downwards.")
            else:
                summary_parts.append("Performance is mixed or stable.")

            # Mention top mover
            # Filter out items with 0 change or neutral
            movers = [i for i in insights_list if abs(i['change_pct']) > 0]
            if movers:
                top_mover = max(movers, key=lambda x: abs(x['change_pct']))
                direction = "growth" if top_mover['change_pct'] > 0 else "decline"
                summary_parts.append(f"{top_mover['category']} is seeing the most significant {direction} ({top_mover['change_pct']}%).")
            
            global_summary = " ".join(summary_parts)
        else:
            global_summary = "Not enough data for a global summary."

        return jsonify({'insights': insights_list, 'global_summary': global_summary}), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/generate-report', methods=['POST'])
def generate_report():
    try:
        data = request.json
        if not data:
            return jsonify({'error': 'No data provided'}), 400

        # Create PDF buffer
        buffer = io.BytesIO()
        p = canvas.Canvas(buffer, pagesize=letter)
        width, height = letter

        # Title
        p.setFont("Helvetica-Bold", 24)
        p.drawString(50, height - 50, "SmartDash AI Report")
        
        # Date
        p.setFont("Helvetica", 12)
        p.drawString(50, height - 70, f"Generated: {datetime.now().strftime('%Y-%m-%d %H:%M')}")

        # Global Summary
        y_position = height - 120
        p.setFont("Helvetica-Bold", 16)
        p.drawString(50, y_position, "Executive Summary")
        y_position -= 25
        
        p.setFont("Helvetica", 12)
        summary_text = data.get('global_summary', 'No summary available.')
        
        # Simple text wrapping (very basic)
        words = summary_text.split()
        line = ""
        for word in words:
            if p.stringWidth(line + " " + word, "Helvetica", 12) < 500:
                line += " " + word
            else:
                p.drawString(50, y_position, line.strip())
                y_position -= 15
                line = word
        p.drawString(50, y_position, line.strip())
        y_position -= 40

        # Insights
        if 'insights' in data and data['insights']:
            p.setFont("Helvetica-Bold", 16)
            p.drawString(50, y_position, "Key Insights")
            y_position -= 25
            p.setFont("Helvetica", 12)

            for insight in data['insights']:
                if y_position < 50: # New page
                    p.showPage()
                    y_position = height - 50
                
                cat = insight.get('category', 'Unknown')
                msg = insight.get('message', '')
                trend = insight.get('trend', '')
                
                # Bullet point
                p.setFont("Helvetica-Bold", 12)
                p.drawString(50, y_position, f"• {cat} ({trend.upper()})")
                y_position -= 15
                p.setFont("Helvetica", 10)
                p.drawString(70, y_position, msg)
                y_position -= 25

        p.showPage()
        p.save()
        buffer.seek(0)

        return send_file(buffer, as_attachment=True, download_name='smart_dash_report.pdf', mimetype='application/pdf')

    except Exception as e:
        print(f"Report Error: {e}")
        return jsonify({'error': str(e)}), 500

@app.route('/correlations', methods=['GET'])
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

        # Predict next 6 periods
        future_X = np.arange(len(values), len(values) + 6).reshape(-1, 1)
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





@app.route('/download-model', methods=['GET'])
def download_model():
    """
    Downloads the last trained model pickle file.
    """
    try:
        model_path = os.path.join(MODELS_DIR, 'model.pkl')
        if not os.path.exists(model_path):
            return jsonify({'error': 'No model trained yet. Run a prediction first.'}), 404
        
        return send_file(model_path, as_attachment=True, download_name='model.pkl')
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/predict-from-file', methods=['POST'])
def predict_from_file():
    """
    Receives a file upload, parses it, and returns predictions.
    """
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file part'}), 400
            
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No selected file'}), 400
            
        if not (file.filename.lower().endswith('.txt') or file.filename.lower().endswith('.pdf')):
             return jsonify({'error': 'Only .txt and .pdf files are supported'}), 400

        # Parse file
        data_points = parse_file_content(file.stream, file.filename)
        
        if len(data_points) < 2:
            return jsonify({'error': 'Need at least 2 data points in file to make predictions'}), 400

        # Run prediction logic (same as /predict)
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
            'original_data': data_points[-10:], # Return last 10 points for context
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


@app.route('/', methods=['GET'])
def root():
    return jsonify({'status': 'ok', 'message': 'SmartDash AI Engine is Ready 🚀'}), 200

@app.route('/health', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'service': 'SmartDash AI Engine'}), 200


if __name__ == '__main__':
    import os
    # Force reload comment
    port = int(os.environ.get('PORT', 5001))
    print(f"🧠 AI Engine running on http://0.0.0.0:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
