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
  X
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
import { AIAnalysisResult, ClassroomMetrics, Student } from './types';
import { cn } from './lib/utils';

const INITIAL_TREND = Array.from({ length: 10 }, (_, i) => ({
  time: `${i * 5}m`,
  score: 70 + Math.random() * 20
}));

const INITIAL_STUDENTS: Student[] = [
  {
    id: '1',
    name: 'burra tejaswini',
    attendance: 'present',
    attentionScore: 92,
    attendancePercentage: 98,
    status: 'focused',
    lastActive: 'Just now',
    details: { age: 16, grade: '10th', parentContact: '555-0101', interests: ['Physics', 'Chess'] }
  },
  {
    id: '2',
    name: 'koncha venkata nandhini reddy',
    attendance: 'present',
    attentionScore: 45,
    attendancePercentage: 85,
    status: 'distracted',
    lastActive: '2m ago',
    feedback: 'Appears to be using a mobile device under the desk.',
    details: { age: 15, grade: '10th', parentContact: '555-0102', interests: ['Art', 'History'] }
  },
  {
    id: '3',
    name: 'mannaru varun teja',
    attendance: 'present',
    attentionScore: 88,
    attendancePercentage: 95,
    status: 'focused',
    lastActive: 'Just now',
    details: { age: 16, grade: '10th', parentContact: '555-0103', interests: ['Math', 'Coding'] }
  },
  {
    id: '4',
    name: 'jana sruthi',
    attendance: 'late',
    attentionScore: 62,
    attendancePercentage: 92,
    status: 'idle',
    lastActive: '5m ago',
    details: { age: 15, grade: '10th', parentContact: '555-0104', interests: ['Music', 'Biology'] }
  },
  {
    id: '5',
    name: 'ooduru vinod kumar',
    attendance: 'absent',
    attentionScore: 0,
    attendancePercentage: 78,
    status: 'idle',
    lastActive: 'Yesterday',
    details: { age: 16, grade: '10th', parentContact: '555-0105', interests: ['Sports', 'Drama'] }
  }
];

export default function App() {
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'students'>('dashboard');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [metrics, setMetrics] = useState<ClassroomMetrics>({
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
  });
  
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
            const iden = result.studentIdentifications?.find(i => i.name.toLowerCase().includes(student.name.toLowerCase()));
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
          <NavItem icon={<Activity size={20} />} label="Analytics" />
          <NavItem icon={<Bell size={20} />} label="Notifications" badge="3" />
          <NavItem icon={<Settings size={20} />} label="Settings" />
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
              {activeTab === 'dashboard' ? 'Classroom Overview' : 'Student Management'}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === 'dashboard' ? 'Real-time attention monitoring active' : 'Manage student details and attendance'}
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
          ) : (
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
                      <h3 className="text-3xl font-bold text-slate-800">{selectedStudent.name}</h3>
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
                  <button className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                    Contact Parent
                  </button>
                  <button className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100">
                    View Full Report
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
