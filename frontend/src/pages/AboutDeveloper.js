import {
    Github, Linkedin, Mail, Code2, Brain, Database, BarChart3,
    Cpu, Globe, Sparkles, ExternalLink, MapPin, GraduationCap
} from 'lucide-react';

const skills = [
    { name: 'Python', icon: Code2, color: '#3b82f6', bg: 'rgba(59,130,246,0.1)' },
    { name: 'Machine Learning', icon: Brain, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' },
    { name: 'Data Preprocessing', icon: Database, color: '#22c55e', bg: 'rgba(34,197,94,0.1)' },
    { name: 'EDA', icon: BarChart3, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
    { name: 'Deep Learning', icon: Cpu, color: '#ec4899', bg: 'rgba(236,72,153,0.1)' },
    { name: 'Data Visualization', icon: BarChart3, color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
    { name: 'Statistical Analysis', icon: Sparkles, color: '#f97316', bg: 'rgba(249,115,22,0.1)' },
    { name: 'Model Training', icon: Brain, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
];

const socials = [
    {
        label: 'GitHub',
        icon: Github,
        url: 'https://github.com/suyash770',
        color: '#f1f5f9',
        bg: 'rgba(241,245,249,0.08)',
        hoverBg: 'rgba(241,245,249,0.15)',
        username: '@suyash770',
    },
    {
        label: 'LinkedIn',
        icon: Linkedin,
        url: 'https://www.linkedin.com/in/suyashgupta23/',
        color: '#0a66c2',
        bg: 'rgba(10,102,194,0.1)',
        hoverBg: 'rgba(10,102,194,0.2)',
        username: 'suyashgupta23',
    },
    {
        label: 'Email',
        icon: Mail,
        url: 'mailto:guptasuyash770@gmail.com',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.1)',
        hoverBg: 'rgba(239,68,68,0.2)',
        username: 'guptasuyash770@gmail.com',
    },
];

export default function AboutDeveloper() {
    return (
        <div className="animate-fade-in max-w-4xl mx-auto">
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-white mb-1">About the Developer</h1>
                <p className="text-slate-400 text-sm">The mind behind SmartDash</p>
            </div>

            {/* Hero Card */}
            <div className="glass-card rounded-2xl p-8 mb-6 relative overflow-hidden">
                {/* Background decoration */}
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)' }} />
                <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10"
                    style={{ background: 'radial-gradient(circle, #22c55e 0%, transparent 70%)' }} />

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 relative z-10">
                    {/* Avatar */}
                    <div className="relative group">
                        <div className="w-32 h-32 rounded-2xl flex-shrink-0 overflow-hidden
                            shadow-xl transition-transform duration-300 group-hover:scale-105
                            border-2 border-indigo-500/30">
                            <img
                                src="/developer.png"
                                alt="Suyash Gupta"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {/* Online indicator */}
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full
                            border-[3px] border-dark-800 animate-pulse-glow" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-white mb-1">Suyash Gupta</h2>
                        <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                            <Brain className="w-4 h-4 text-indigo-400" />
                            <span className="text-indigo-400 text-sm font-semibold">Data Scientist & ML Engineer</span>
                        </div>

                        <p className="text-slate-400 text-sm leading-relaxed max-w-xl mb-4">
                            Passionate data scientist with a strong foundation in turning raw data into actionable insights.
                            Skilled in the full data science lifecycle — from data preprocessing, exploratory data analysis (EDA),
                            and feature engineering to building, training, and deploying machine learning models.
                            Adept at uncovering hidden patterns in complex datasets and translating them into
                            data-driven solutions that drive real business impact.
                        </p>

                        <div className="flex items-center justify-center md:justify-start gap-4 text-xs text-slate-500">
                            <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                <span>India</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <GraduationCap className="w-3 h-3" />
                                <span>Data Science</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Globe className="w-3 h-3" />
                                <span>Open to opportunities</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Skills & Connect - Side by Side */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* Skills */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-4 h-4 text-indigo-400" />
                        <h3 className="text-sm font-semibold text-white">Skills & Expertise</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        {skills.map(({ name, icon: Icon, color, bg }) => (
                            <div key={name}
                                className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-dark-600/30
                                hover:border-dark-600/60 transition-all duration-200 hover:scale-[1.02] cursor-default"
                                style={{ backgroundColor: bg }}>
                                <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                                <span className="text-xs font-medium text-slate-300">{name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Connect */}
                <div className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Globe className="w-4 h-4 text-emerald-400" />
                        <h3 className="text-sm font-semibold text-white">Connect with Me</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                        {socials.map(({ label, icon: Icon, url, color, bg, username }) => (
                            <a key={label}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-3 px-4 py-3.5 rounded-xl border border-dark-600/30
                                hover:border-dark-600/60 transition-all duration-200 hover:scale-[1.02] group"
                                style={{ backgroundColor: bg }}>
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: `${color}20` }}>
                                    <Icon className="w-4 h-4" style={{ color }} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-white">{label}</p>
                                    <p className="text-[11px] text-slate-500 truncate">{username}</p>
                                </div>
                                <ExternalLink className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-400
                                    transition-colors flex-shrink-0" />
                            </a>
                        ))}
                    </div>
                </div>
            </div>

            {/* Footer credit */}
            <div className="glass-card rounded-2xl p-5 text-center">
                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-500">
                    <span>Developed by</span>
                    <span className="text-indigo-400 font-semibold">Suyash Gupta</span>
                    <span>•</span>
                    <span>SmartDash © {new Date().getFullYear()}</span>
                </div>
            </div>
        </div>
    );
}
