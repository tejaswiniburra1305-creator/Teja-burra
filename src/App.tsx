import React, { useState, useEffect, useRef } from 'react';
import { 
  Users, 
  Brain, 
  AlertCircle, 
  TrendingUp, 
  Camera, 
  CameraOff,
  LayoutDashboard,
  Bell,
  Settings,
  ChevronRight,
  Activity,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Calendar,
  Percent,
  Info,
  X,
  Phone,
  FileText,
  Printer,
  Download,
  Share2
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { analyzeClassroomImage } from './services/geminiService';
import { AIAnalysisResult, ClassroomMetrics, Student, Notification } from './types';
import { cn } from './lib/utils';

const INITIAL_TREND = Array.from({ length: 10 }, (_, i) => ({
  time: `${i * 5}m`,
  score: 70 + Math.random() * 20
}));

const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    rollNumber: '2023CS01',
    name: 'Burra Tejaswin',
    attendance: 'present',
    attentionScore: 92,
    attendancePercentage: 98,
    status: 'focused',
    lastActive: 'Just now',
    avatar: 'https://picsum.photos/seed/tejaswin/100/100',
    details: { age: 18, grade: '1st', parentContact: '9798356273', interests: ['music', 'technical events'] }
  },
  {
    id: '2',
    rollNumber: '2023CS02',
    name: 'Koncha Venkata Nandhini Reddy',
    attendance: 'present',
    attentionScore: 45,
    attendancePercentage: 85,
    status: 'distracted',
    lastActive: '2m ago',
    avatar: 'https://picsum.photos/seed/nandhini/100/100',
    feedback: 'Appears to be using a mobile device under the desk.',
    details: { age: 18, grade: '2nd', parentContact: '9989030737', interests: ['Art', 'History'] }
  },
  {
    id: '3',
    rollNumber: '2023CS03',
    name: 'Mannaru Varun Teja',
    attendance: 'present',
    attentionScore: 88,
    attendancePercentage: 95,
    status: 'focused',
    lastActive: 'Just now',
    avatar: 'https://picsum.photos/seed/varun/100/100',
    details: { age: 18, grade: '3rd', parentContact: '8873289202', interests: ['technical events', 'Coding'] }
  },
  {
    id: '4',
    rollNumber: '2023CS04',
    name: 'Jana sruthi',
    attendance: 'absent',
    attentionScore: 62,
    attendancePercentage: 92,
    status: 'idle',
    lastActive: '5m ago',
    avatar: 'https://picsum.photos/seed/sruthi/100/100',
    details: { age: 18, grade: '4th', parentContact: '9703422460', interests: ['Music', 'technical events'] }
  },
  {
    id: '5',
    rollNumber: '2023CS05',
    name: 'Ooduru Vinod Kumar Reddy',
    attendance: 'present',
    attentionScore: 55,
    attendancePercentage: 78,
    status: 'idle',
    lastActive: 'Yesterday',
    avatar: 'https://picsum.photos/seed/vinod/100/100',
    details: { age: 18, grade: '5th', parentContact: '8923456708', interests: ['Sports', 'technical events'] }
  },
  {
    id: '6',
    rollNumber: '2023CS06',
    name: 'Kanchi Thilak',
    attendance: 'absent',
    attentionScore: 0,
    attendancePercentage: 92,
    status: 'idle',
    lastActive: '2 days ago',
    avatar: 'https://picsum.photos/seed/thilak/100/100',
    details: { age: 18, grade: '6th', parentContact: '9123456789', interests: ['Gaming', 'Math'] }
  },
  {
    id: '7',
    rollNumber: '2023CS07',
    name: 'Kuntumuri Shanmugam',
    attendance: 'present',
    attentionScore: 0,
    attendancePercentage: 94,
    status: 'idle',
    lastActive: '1h ago',
    avatar: 'https://picsum.photos/seed/shanmugam/100/100',
    details: { age: 18, grade: '7th', parentContact: '9876543210', interests: ['Science', 'Literature'] }
  },
  {
    id: '8',
    rollNumber: '2023CS08',
    name: 'C Sai Charitesh',
    attendance: 'present',
    attentionScore: 0,
    attendancePercentage: 95,
    status: 'focused',
    lastActive: 'Just now',
    avatar: 'https://picsum.photos/seed/charitesh/100/100',
    details: { age: 18, grade: '8th', parentContact: '9988776655', interests: ['Robotics', 'AI'] }
  }
];

export default function App() {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students' | 'settings' | 'analytics' | 'notifications'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [parentReportStudent, setParentReportStudent] = useState<Student | null>(null);
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: 1, type: 'alert', title: 'Attention Drop Detected', message: 'Class average attention dropped below 70% in the last 5 minutes.', time: '2m ago', bg: 'bg-rose-50', border: 'border-rose-100', details: 'The drop was most significant in the back three rows. This often happens during long lectures without interactive elements.' },
    { id: 2, type: 'info', title: 'Attendance Update', message: 'Jana sruthi marked as absent for the current session.', time: '15m ago', bg: 'bg-blue-50', border: 'border-blue-100', details: 'Jana has missed 3 sessions this month. It might be time to check in with her parents.' },
    { id: 3, type: 'success', title: 'Engagement Milestone', message: 'Your class reached a peak engagement score of 94%!', time: '1h ago', bg: 'bg-emerald-50', border: 'border-emerald-100', details: 'This is the highest engagement recorded this week. The use of visual aids seems to be very effective.' },
    { id: 4, type: 'system', title: 'System Update', message: 'FocusFlow AI model updated to v2.4 for better accuracy.', time: '5h ago', bg: 'bg-slate-50', border: 'border-slate-100', details: 'New features include better detection of micro-expressions and improved low-light performance.' },
  ]);
  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'alert': return <AlertCircle className="text-rose-500" />;
      case 'info': return <Users className="text-blue-500" />;
      case 'success': return <TrendingUp className="text-emerald-500" />;
      case 'system': return <Settings className="text-slate-500" />;
      default: return <Bell className="text-slate-500" />;
    }
  };

  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('focusflow_students');
    return saved ? JSON.parse(saved) : INITIAL_STUDENTS;
  });
  const [metrics, setMetrics] = useState<ClassroomMetrics>(() => {
    const saved = localStorage.getItem('focusflow_metrics');
    return saved ? JSON.parse(saved) : {
      averageAttention: 82,
      activeStudents: 24,
      distractedCount: 3,
      attendanceRate: 94,
      engagementTrend: INITIAL_TREND,
      insights: [
        "High engagement during the current visual presentation.",
        "Slight dip in attention in the back row observed 5 minutes ago.",
        "Overall classroom focus is above average for this time of day."
      ]
    };
  });

  // Persist data to local storage
  useEffect(() => {
    localStorage.setItem('focusflow_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('focusflow_metrics', JSON.stringify(metrics));
  }, [metrics]);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isCameraActive) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [isCameraActive]);

  const startCamera = async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setCameraError("Unable to access camera. Please check permissions.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current || isAnalyzing) return;

    setIsAnalyzing(true);
    try {
      const canvas = canvasRef.current;
      const video = videoRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Image = canvas.toDataURL('image/jpeg').split(',')[1];
        
        const result = await analyzeClassroomImage(base64Image);
        
        // Update students based on AI identification
        if (result.studentIdentifications) {
          setStudents(prev => prev.map(student => {
            const iden = result.studentIdentifications?.find(i => i.rollNumber === student.rollNumber);
            if (iden) {
              return {
                ...student,
                status: iden.status,
                attentionScore: iden.score,
                feedback: iden.feedback,
                lastActive: 'Just now'
              };
            }
            return student;
          }));
        }

        // Update metrics based on AI result
        setMetrics(prev => ({
          ...prev,
          averageAttention: result.overallScore,
          activeStudents: result.studentCount,
          distractedCount: result.distractedCount,
          engagementTrend: [...prev.engagementTrend.slice(1), { 
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), 
            score: result.overallScore 
          }],
          insights: [result.summary, ...result.recommendations].slice(0, 5)
        }));
      }
    } catch (err) {
      console.error("Analysis failed:", err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Auto-analyze every 30 seconds if camera is active
  useEffect(() => {
    let interval: number;
    if (isCameraActive) {
      interval = window.setInterval(captureAndAnalyze, 30000);
    }
    return () => clearInterval(interval);
  }, [isCameraActive]);

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans selection:bg-indigo-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 z-50 hidden lg:flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <Brain className="text-white w-6 h-6" />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">FocusFlow</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          <NavItem 
            icon={<LayoutDashboard size={20} />} 
            label="Dashboard" 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')}
          />
          <NavItem 
            icon={<Users size={20} />} 
            label="Students" 
            active={activeTab === 'students'} 
            onClick={() => setActiveTab('students')}
          />
          <NavItem 
            icon={<Activity size={20} />} 
            label="Analytics" 
            active={activeTab === 'analytics'}
            onClick={() => setActiveTab('analytics')}
          />
          <NavItem 
            icon={<Bell size={20} />} 
            label="Notifications" 
            badge={notifications.length > 0 ? notifications.length.toString() : undefined} 
            active={activeTab === 'notifications'}
            onClick={() => setActiveTab('notifications')}
          />
          <NavItem 
            icon={<Settings size={20} />} 
            label="Settings" 
            active={activeTab === 'settings'}
            onClick={() => setActiveTab('settings')}
          />
        </nav>

        <div className="p-4 mt-auto">
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Class</p>
            <p className="text-sm font-bold text-slate-700">Advanced Physics 101</p>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
              <Clock size={12} /> 45m remaining
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="lg:pl-64 min-h-screen">
        {/* Header */}
        <header className="sticky top-0 bg-white/80 backdrop-blur-md border-b border-slate-200 z-40 px-8 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' ? 'Classroom Overview' : 
               activeTab === 'students' ? 'Student Management' : 
               activeTab === 'analytics' ? 'Classroom Analytics' :
               activeTab === 'notifications' ? 'Notifications' : 'System Settings'}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === 'dashboard' ? 'Real-time attention monitoring active' : 
               activeTab === 'students' ? 'Manage student details and attendance' : 
               activeTab === 'analytics' ? 'Deep dive into classroom performance trends' :
               activeTab === 'notifications' ? 'Recent alerts and system updates' : 'Configure application preferences'}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsCameraActive(!isCameraActive)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all duration-300 shadow-sm",
                isCameraActive 
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100" 
                  : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100"
              )}
            >
              {isCameraActive ? <CameraOff size={18} /> : <Camera size={18} />}
              {isCameraActive ? "Stop Monitoring" : "Start Monitoring"}
            </button>
            <div className="w-10 h-10 rounded-full bg-slate-200 border-2 border-white shadow-sm overflow-hidden">
              <img src="https://picsum.photos/seed/teacher/100/100" alt="Profile" referrerPolicy="no-referrer" />
            </div>
          </div>
        </header>

        <div className="p-8 space-y-8">
          {activeTab === 'dashboard' ? (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard 
                  title="Average Attention" 
                  value={`${metrics.averageAttention}%`} 
                  trend="+2.4%" 
                  icon={<TrendingUp className="text-emerald-500" />}
                  color="emerald"
                />
                <StatCard 
                  title="Attendance Rate" 
                  value={`${metrics.attendanceRate}%`} 
                  icon={<Calendar className="text-indigo-500" />}
                  color="indigo"
                />
                <StatCard 
                  title="Distracted" 
                  value={metrics.distractedCount} 
                  trend="-1" 
                  icon={<AlertCircle className="text-amber-500" />}
                  color="amber"
                />
                <StatCard 
                  title="Engagement Level" 
                  value="High" 
                  icon={<Activity className="text-blue-500" />}
                  color="blue"
                />
              </div>

              <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
                {/* Live Feed & Analysis */}
                <div className="xl:col-span-2 space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                      <h3 className="font-bold text-lg flex items-center gap-2">
                        <Camera size={20} className="text-indigo-600" />
                        Live Classroom Feed
                      </h3>
                      {isAnalyzing && (
                        <div className="flex items-center gap-2 text-indigo-600 text-sm font-medium">
                          <div className="w-2 h-2 bg-indigo-600 rounded-full animate-ping" />
                          AI Analyzing...
                        </div>
                      )}
                    </div>
                    <div className="relative aspect-video bg-slate-900 flex items-center justify-center group">
                      {cameraError ? (
                        <div className="text-center space-y-4 p-8">
                          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle size={40} className="text-rose-500" />
                          </div>
                          <div>
                            <p className="text-white font-bold">Camera Access Error</p>
                            <p className="text-slate-400 text-sm mt-1">{cameraError}</p>
                          </div>
                          <button 
                            onClick={startCamera}
                            className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700 transition-all"
                          >
                            Try Again
                          </button>
                        </div>
                      ) : !isCameraActive ? (
                        <div className="text-center space-y-4">
                          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto">
                            <CameraOff size={40} className="text-slate-600" />
                          </div>
                          <p className="text-slate-400 font-medium">Camera is currently inactive</p>
                        </div>
                      ) : (
                        <>
                          <video 
                            ref={videoRef} 
                            autoPlay 
                            playsInline 
                            muted 
                            className="w-full h-full object-cover"
                          />
                          {/* Simulated Overlays */}
                          <div className="absolute inset-0 pointer-events-none p-4">
                            <div className="w-full h-full border-2 border-indigo-500/30 rounded-lg relative overflow-hidden">
                               <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm text-white text-xs px-2 py-1 rounded border border-white/20">
                                 HD LIVE • {new Date().toLocaleTimeString()}
                               </div>
                            </div>
                          </div>
                        </>
                      )}
                      <canvas ref={canvasRef} className="hidden" />
                      
                      {isCameraActive && (
                        <button 
                          onClick={captureAndAnalyze}
                          disabled={isAnalyzing}
                          className="absolute bottom-6 right-6 bg-white/90 hover:bg-white text-slate-900 px-6 py-3 rounded-2xl font-bold shadow-xl backdrop-blur-sm transition-all active:scale-95 disabled:opacity-50"
                        >
                          Manual Analysis
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Engagement Chart */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="font-bold text-lg">Engagement Trend</h3>
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 bg-indigo-500 rounded-full" />
                          <span>Attention Score</span>
                        </div>
                      </div>
                    </div>
                    <div className="h-64 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={metrics.engagementTrend}>
                          <defs>
                            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                          <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#6366f1" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorScore)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Insights & Notifications */}
                <div className="space-y-8">
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                      <Brain size={20} className="text-indigo-600" />
                      AI Insights
                    </h3>
                    <div className="space-y-4">
                      <AnimatePresence mode="popLayout">
                        {metrics.insights.map((insight, idx) => (
                          <motion.div 
                            key={insight}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ delay: idx * 0.1 }}
                            className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-indigo-200 transition-colors"
                          >
                            <div className="mt-1">
                              <CheckCircle2 size={18} className="text-indigo-500" />
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">{insight}</p>
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    </div>
                  </div>

                  <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 relative overflow-hidden">
                    <div className="relative z-10">
                      <h4 className="font-bold text-lg mb-2">Smart Recommendation</h4>
                      <p className="text-indigo-100 text-sm mb-6">
                        Attention is peaking. This is the perfect time to introduce the most complex concept of the lesson.
                      </p>
                      <button className="bg-white text-indigo-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-indigo-50 transition-colors">
                        View Lesson Plan
                      </button>
                    </div>
                    <TrendingUp className="absolute -bottom-4 -right-4 w-32 h-32 text-indigo-500/30 rotate-12" />
                  </div>

                  {/* Student List Preview */}
                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold text-lg">Recent Activity</h3>
                      <button 
                        onClick={() => setActiveTab('students')}
                        className="text-indigo-600 text-sm font-bold hover:underline"
                      >
                        View All
                      </button>
                    </div>
                    <div className="space-y-4">
                      {students.slice(0, 4).map(student => (
                        <ActivityItem 
                          key={student.id}
                          student={student}
                          onClick={() => setSelectedStudent(student)}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : activeTab === 'students' ? (
            /* Students Tab Content */
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard 
                  title="Total Enrolled" 
                  value={students.length} 
                  icon={<Users className="text-indigo-500" />}
                  color="indigo"
                />
                <StatCard 
                  title="Present Today" 
                  value={students.filter(s => s.attendance === 'present' || s.attendance === 'late').length} 
                  icon={<CheckCircle2 className="text-emerald-500" />}
                  color="emerald"
                />
                <StatCard 
                  title="Avg. Attendance" 
                  value={`${Math.round(students.reduce((acc, s) => acc + s.attendancePercentage, 0) / students.length)}%`} 
                  icon={<Percent className="text-blue-500" />}
                  color="blue"
                />
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Roll No</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attendance</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Attention</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Overall %</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {students.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-500 text-sm">
                          {student.rollNumber}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <div>
                              <p className="font-bold text-slate-800">{student.name}</p>
                              <p className="text-xs text-slate-500">{student.details.grade} Grade</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={cn(
                            "px-3 py-1 rounded-full text-xs font-bold",
                            student.attendance === 'present' ? "bg-emerald-50 text-emerald-600" :
                            student.attendance === 'late' ? "bg-amber-50 text-amber-600" :
                            "bg-rose-50 text-rose-600"
                          )}>
                            {student.attendance.charAt(0).toUpperCase() + student.attendance.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                              <div 
                                className={cn("h-full rounded-full", student.attentionScore > 80 ? "bg-emerald-500" : student.attentionScore > 50 ? "bg-amber-500" : "bg-rose-500")} 
                                style={{ width: `${student.attentionScore}%` }} 
                              />
                            </div>
                            <span className="text-sm font-bold text-slate-700">{student.attentionScore}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-700">
                          {student.attendancePercentage}%
                        </td>
                        <td className="px-6 py-4">
                          <button 
                            onClick={() => setSelectedStudent(student)}
                            className="p-2 text-slate-400 hover:text-indigo-600 transition-colors"
                          >
                            <Info size={20} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : activeTab === 'analytics' ? (
            /* Analytics Tab Content */
            <div className="space-y-8">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                  <div className="flex items-center justify-between mb-8">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800">Class Performance Trend</h3>
                      <p className="text-sm text-slate-500">Average attention levels over the last 60 minutes</p>
                    </div>
                    <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold text-slate-600">
                      <option>Last 60 mins</option>
                      <option>Last 24 hours</option>
                      <option>Last 7 days</option>
                    </select>
                  </div>
                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={INITIAL_TREND}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="time" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          dy={10}
                        />
                        <YAxis 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{ fill: '#94a3b8', fontSize: 12 }}
                          domain={[0, 100]}
                        />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="score" 
                          stroke="#4f46e5" 
                          strokeWidth={4} 
                          dot={{ fill: '#4f46e5', strokeWidth: 2, r: 4, stroke: '#fff' }}
                          activeDot={{ r: 6, strokeWidth: 0 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-emerald-600 rounded-3xl p-6 text-white shadow-xl shadow-emerald-100">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-white/20 rounded-xl">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="font-bold">Peak Engagement</h4>
                    </div>
                    <p className="text-3xl font-black mb-1">94%</p>
                    <p className="text-emerald-100 text-xs font-medium">Recorded at 10:15 AM today</p>
                  </div>

                  <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
                    <h4 className="font-bold text-slate-800 mb-4">Top Performers</h4>
                    <div className="space-y-4">
                      {students.sort((a, b) => b.attentionScore - a.attentionScore).slice(0, 3).map((student, idx) => (
                        <div key={student.id} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600">
                              {idx + 1}
                            </div>
                            <p className="text-sm font-bold text-slate-700">{student.name}</p>
                          </div>
                          <span className="text-sm font-black text-indigo-600">{student.attentionScore}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Avg. Attention" value="82%" trend="+5%" icon={<Brain className="text-indigo-500" />} color="indigo" />
                <StatCard title="Attendance" value="94%" trend="+2%" icon={<Users className="text-emerald-500" />} color="emerald" />
                <StatCard title="Engagement" value="High" trend="Stable" icon={<Activity className="text-blue-500" />} color="blue" />
                <StatCard title="Alerts" value="3" trend="-12%" icon={<AlertCircle className="text-rose-500" />} color="rose" />
              </div>
            </div>
          ) : activeTab === 'notifications' ? (
            /* Notifications Tab Content */
            <div className="max-w-3xl space-y-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xl font-bold text-slate-800">Recent Alerts</h3>
                <button 
                  onClick={() => setNotifications([])}
                  className="text-sm font-bold text-indigo-600 hover:underline"
                >
                  Clear all
                </button>
              </div>
              
              <div className="space-y-4">
                {notifications.length > 0 ? (
                  notifications.map(notif => (
                    <motion.div 
                      key={notif.id}
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className={cn("p-6 rounded-[32px] border flex gap-6 items-start transition-all hover:shadow-md", notif.bg, notif.border)}
                    >
                      <div className="p-3 bg-white rounded-2xl shadow-sm">
                        {getNotificationIcon(notif.type)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className="font-bold text-slate-900">{notif.title}</h4>
                          <span className="text-xs font-bold text-slate-400">{notif.time}</span>
                        </div>
                        <p className="text-sm text-slate-600 leading-relaxed">{notif.message}</p>
                        <div className="mt-4 flex gap-3">
                          <button 
                            onClick={() => setNotifications(prev => prev.filter(n => n.id !== notif.id))}
                            className="text-xs font-bold px-4 py-2 bg-white rounded-xl shadow-sm hover:shadow-md transition-all"
                          >
                            Dismiss
                          </button>
                          <button 
                            onClick={() => setSelectedNotification(notif)}
                            className="text-xs font-bold px-4 py-2 bg-slate-900 text-white rounded-xl shadow-sm hover:bg-slate-800 transition-all"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-20 bg-slate-50 rounded-[40px] border border-dashed border-slate-200">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                      <Bell className="text-slate-300" size={32} />
                    </div>
                    <p className="text-slate-500 font-medium">No new notifications</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* Settings Tab Content */
            <div className="max-w-2xl space-y-8">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-xl font-bold mb-6">Database Settings</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <div>
                      <p className="font-bold text-slate-700">Local Database Storage</p>
                      <p className="text-sm text-slate-500">All student data is currently stored in your browser.</p>
                    </div>
                    <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                      Active
                    </div>
                  </div>
                  
                  <div className="pt-4">
                    <p className="text-sm text-slate-500 mb-4">
                      Resetting the database will clear all local changes and restore the initial student roster. This action cannot be undone.
                    </p>
                    <button 
                      onClick={() => {
                        if (window.confirm("Are you sure you want to reset the database? All local changes will be lost.")) {
                          localStorage.removeItem('focusflow_students');
                          localStorage.removeItem('focusflow_metrics');
                          window.location.reload();
                        }
                      }}
                      className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl font-bold hover:bg-rose-100 transition-all border border-rose-100"
                    >
                      Reset Local Database
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
                <h3 className="text-xl font-bold mb-6">System Preferences</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-700">Auto-Analysis Interval</p>
                    <select className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-medium text-slate-600">
                      <option>30 seconds</option>
                      <option>1 minute</option>
                      <option>5 minutes</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-slate-700">Notifications</p>
                    <div className="w-12 h-6 bg-indigo-600 rounded-full relative">
                      <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Student Details Modal */}
      <AnimatePresence>
        {selectedStudent && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedStudent(null)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-[32px] shadow-2xl overflow-hidden"
            >
              <div className="p-8">
                <div className="flex items-start justify-between mb-8">
                  <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-3xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg shadow-indigo-200">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="text-3xl font-bold text-slate-800">{selectedStudent.name}</h3>
                        <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                          {selectedStudent.rollNumber}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <User size={14} /> {selectedStudent.details.grade} Grade
                        </span>
                        <span className="flex items-center gap-1 text-sm text-slate-500">
                          <Calendar size={14} /> Age {selectedStudent.details.age}
                        </span>
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedStudent(null)}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Today's Performance</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Attention</p>
                          <p className="text-xl font-bold text-slate-800">{selectedStudent.attentionScore}%</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <p className="text-xs text-slate-500 mb-1">Status</p>
                          <p className={cn(
                            "text-lg font-bold",
                            selectedStudent.status === 'focused' ? "text-emerald-600" : "text-rose-600"
                          )}>
                            {selectedStudent.status.charAt(0).toUpperCase() + selectedStudent.status.slice(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">AI Feedback</h4>
                      <div className="bg-indigo-50 p-4 rounded-2xl border border-indigo-100 flex gap-3">
                        <MessageSquare size={18} className="text-indigo-500 mt-1 flex-shrink-0" />
                        <p className="text-sm text-indigo-900 leading-relaxed italic">
                          {selectedStudent.feedback || "No specific feedback for this session. Student is maintaining consistent focus levels."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Student Details</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Parent Contact</span>
                          <span className="font-bold text-slate-700">{selectedStudent.details.parentContact}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Attendance Rate</span>
                          <span className="font-bold text-slate-700">{selectedStudent.attendancePercentage}%</span>
                        </div>
                        <div>
                          <p className="text-sm text-slate-500 mb-2">Interests</p>
                          <div className="flex flex-wrap gap-2">
                            {selectedStudent.details.interests.map(interest => (
                              <span key={interest} className="px-3 py-1 bg-slate-100 text-slate-600 rounded-full text-xs font-bold">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8 pt-8 border-t border-slate-100 flex justify-end gap-4">
                  <a 
                    href={`tel:${selectedStudent.details.parentContact}`}
                    className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors flex items-center gap-2"
                  >
                    <Phone size={18} /> Contact Parent
                  </a>
                  <button 
                    onClick={() => {
                      setParentReportStudent(selectedStudent);
                      setSelectedStudent(null);
                    }}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100 flex items-center gap-2"
                  >
                    <FileText size={18} /> View Full Report
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Parent Report Modal */}
      <AnimatePresence>
        {parentReportStudent && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setParentReportStudent(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 40 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 40 }}
              className="relative w-full max-w-4xl bg-white rounded-[40px] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white">
                    <FileText size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-800">Academic & Engagement Report</h3>
                    <p className="text-sm text-slate-500">Official Classroom Performance Summary</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200">
                    <Printer size={20} />
                  </button>
                  <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200">
                    <Download size={20} />
                  </button>
                  <button className="p-2 hover:bg-white rounded-xl transition-colors text-slate-500 hover:text-indigo-600 border border-transparent hover:border-slate-200">
                    <Share2 size={20} />
                  </button>
                  <button 
                    onClick={() => setParentReportStudent(null)}
                    className="p-2 hover:bg-white rounded-xl transition-colors text-slate-400 hover:text-rose-500 border border-transparent hover:border-slate-200 ml-2"
                  >
                    <X size={24} />
                  </button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-10">
                {/* Report Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-10 border-b border-slate-100">
                  <div className="flex items-center gap-8">
                    <div className="w-32 h-32 rounded-[40px] bg-slate-100 border-4 border-white shadow-xl overflow-hidden">
                      <img src={parentReportStudent.avatar} alt={parentReportStudent.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-4xl font-black text-slate-900 tracking-tight">{parentReportStudent.name}</h2>
                      <div className="flex flex-wrap gap-3">
                        <span className="px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-bold border border-indigo-100">
                          Grade {parentReportStudent.details.grade}
                        </span>
                        <span className="px-4 py-1.5 bg-slate-100 text-slate-600 rounded-full text-sm font-bold">
                          Roll No: {parentReportStudent.rollNumber}
                        </span>
                        <span className="px-4 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-bold border border-emerald-100">
                          {parentReportStudent.attendancePercentage}% Attendance
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white p-6 rounded-[32px] min-w-[240px]">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">Parent Contact</p>
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center">
                        <Phone size={18} className="text-indigo-400" />
                      </div>
                      <div>
                        <p className="font-bold text-lg">{parentReportStudent.details.parentContact}</p>
                        <p className="text-xs text-slate-500">Primary Contact Number</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                        <Brain size={20} />
                      </div>
                      <h4 className="font-bold text-slate-700">Attention Score</h4>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-slate-900">{parentReportStudent.attentionScore}%</span>
                      <span className="text-sm font-bold text-emerald-500 mb-1.5">↑ 4% this week</span>
                    </div>
                    <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${parentReportStudent.attentionScore}%` }} 
                      />
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
                        <CheckCircle2 size={20} />
                      </div>
                      <h4 className="font-bold text-slate-700">Participation</h4>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-slate-900">High</span>
                      <span className="text-sm font-bold text-emerald-500 mb-1.5">Top 10%</span>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                      Active participation in classroom discussions and group activities.
                    </p>
                  </div>

                  <div className="bg-white p-6 rounded-[32px] border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                        <TrendingUp size={20} />
                      </div>
                      <h4 className="font-bold text-slate-700">Learning Path</h4>
                    </div>
                    <div className="flex items-end gap-2">
                      <span className="text-4xl font-black text-slate-900">Steady</span>
                      <span className="text-sm font-bold text-slate-400 mb-1.5">On track</span>
                    </div>
                    <p className="mt-4 text-xs text-slate-500 leading-relaxed">
                      Consistent progress across all core subjects this semester.
                    </p>
                  </div>
                </div>

                {/* Detailed Analysis */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <MessageSquare size={20} className="text-indigo-600" />
                      Teacher's Observation
                    </h4>
                    <div className="bg-indigo-50/50 p-8 rounded-[32px] border border-indigo-100 relative">
                      <span className="absolute top-4 left-4 text-6xl text-indigo-200 font-serif opacity-50">"</span>
                      <p className="text-indigo-900 leading-relaxed italic relative z-10">
                        {parentReportStudent.feedback || "The student has shown exceptional focus during today's session. They are consistently engaged with the material and contribute meaningfully to class discussions. We recommend continuing to encourage their interest in their favorite subjects."}
                      </p>
                      <div className="mt-6 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-xs">
                          TR
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-800">Dr. Thomas Reed</p>
                          <p className="text-xs text-slate-500">Lead Physics Instructor</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h4 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                      <Activity size={20} className="text-indigo-600" />
                      Engagement Trends
                    </h4>
                    <div className="bg-slate-50 p-6 rounded-[32px] border border-slate-100 h-[240px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={INITIAL_TREND}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                          <XAxis dataKey="time" hide />
                          <YAxis hide domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="score" 
                            stroke="#4f46e5" 
                            strokeWidth={4} 
                            dot={false}
                            animationDuration={2000}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-8 bg-slate-50 border-t border-slate-100 flex flex-col md:flex-row items-center justify-between gap-4">
                <p className="text-sm text-slate-500 text-center md:text-left">
                  This report is generated automatically by FocusFlow AI. For detailed inquiries, please contact the school administration.
                </p>
                <button 
                  onClick={() => setParentReportStudent(null)}
                  className="w-full md:w-auto px-10 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                >
                  Close Report
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Notification Details Modal */}
      <AnimatePresence>
        {selectedNotification && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedNotification(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-lg bg-white rounded-[40px] shadow-2xl overflow-hidden"
            >
              <div className={cn("p-8", selectedNotification.bg)}>
                <div className="flex items-center justify-between mb-6">
                  <div className="p-3 bg-white rounded-2xl shadow-sm">
                    {getNotificationIcon(selectedNotification.type)}
                  </div>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="p-2 hover:bg-white/50 rounded-full transition-colors"
                  >
                    <X size={24} className="text-slate-400" />
                  </button>
                </div>
                <h3 className="text-2xl font-bold text-slate-900 mb-2">{selectedNotification.title}</h3>
                <p className="text-slate-500 text-sm font-medium">{selectedNotification.time}</p>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Summary</h4>
                  <p className="text-slate-700 leading-relaxed">{selectedNotification.message}</p>
                </div>
                {selectedNotification.details && (
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Detailed Analysis</h4>
                    <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p className="text-sm text-slate-600 leading-relaxed italic">
                        {selectedNotification.details}
                      </p>
                    </div>
                  </div>
                )}
                <div className="pt-4 flex gap-4">
                  <button 
                    onClick={() => {
                      setNotifications(prev => prev.filter(n => n.id !== selectedNotification.id));
                      setSelectedNotification(null);
                    }}
                    className="flex-1 px-6 py-4 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all"
                  >
                    Dismiss Alert
                  </button>
                  <button 
                    onClick={() => setSelectedNotification(null)}
                    className="flex-1 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavItem({ icon, label, active = false, badge, onClick }: { icon: React.ReactNode, label: string, active?: boolean, badge?: string, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center justify-between px-4 py-3 rounded-xl font-semibold transition-all duration-200",
        active ? "bg-indigo-50 text-indigo-700" : "text-slate-500 hover:bg-slate-50 hover:text-slate-700"
      )}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span>{label}</span>
      </div>
      {badge && (
        <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
          {badge}
        </span>
      )}
    </button>
  );
}

function StatCard({ title, value, trend, icon, color }: { title: string, value: string | number, trend?: string, icon: React.ReactNode, color: string }) {
  return (
    <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className={cn("p-2.5 rounded-2xl", `bg-${color}-50`)}>
          {icon}
        </div>
        {trend && (
          <span className={cn(
            "text-xs font-bold px-2 py-1 rounded-full",
            trend.startsWith('+') ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
          )}>
            {trend}
          </span>
        )}
      </div>
      <p className="text-slate-500 text-sm font-medium">{title}</p>
      <h4 className="text-2xl font-bold text-slate-800 mt-1">{value}</h4>
    </div>
  );
}

interface ActivityItemProps {
  key?: string | number;
  student: Student;
  onClick: () => void;
}

function ActivityItem({ student, onClick }: ActivityItemProps) {
  return (
    <div 
      onClick={onClick}
      className="flex items-center justify-between group cursor-pointer hover:bg-slate-50 p-2 rounded-2xl transition-colors"
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 font-bold text-xs group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-colors">
          {student.name.split(' ').map(n => n[0]).join('')}
        </div>
        <div>
          <p className="text-sm font-bold text-slate-700">{student.name}</p>
          <p className={cn("text-xs font-medium", student.status === 'distracted' ? "text-rose-500" : "text-emerald-500")}>
            {student.status.charAt(0).toUpperCase() + student.status.slice(1)}
          </p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-slate-700">{student.attentionScore}%</p>
        <div className="w-16 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
          <div 
            className={cn("h-full rounded-full", student.attentionScore > 80 ? "bg-emerald-500" : student.attentionScore > 60 ? "bg-amber-500" : "bg-rose-500")} 
            style={{ width: `${student.attentionScore}%` }} 
          />
        </div>
      </div>
    </div>
  );
}
