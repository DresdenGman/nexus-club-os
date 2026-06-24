import React, { useState, createContext, useContext, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Calendar, 
  Award, 
  Bell, 
  Search,
  Plus,
  CheckCircle,
  Clock,
  XCircle,
  ChevronRight,
  ChevronLeft,
  BarChart3,
  Upload,
  LogOut,
  Sparkles,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { useAuth } from './AuthContext';
import { 
  fetchClubs, createClub as apiCreateClub, updateClub, deleteClub as apiDeleteClub,
  fetchApprovals, createApproval, updateApproval,
  fetchUsers, deleteUser as apiDeleteUser,
  askAI, generateClubDescription, fetchClubMembers, fetchMyMemberships, applyToClub, approveMembership, fetchPendingApplications
} from './api';

// --- i18n Dictionary ---
const dict = {
  en: {
    platform_overview: 'Platform Overview',
    club_directory: 'Club Directory',
    approvals: 'Approvals',
    members: 'Members',
    resources: 'Resources',
    login_title: 'Club Platform',
    login_subtitle: 'BRS Club Platform // Beijing Royal School',
    email: 'Email or Username',
    password: 'Password',
    login_btn: 'Log In',
    signup_btn: 'Sign Up',
    switch_signup: 'Need an account? Sign Up',
    switch_login: 'Already have an account? Log In',
    admin_user: 'Admin User',
    sys_admin: 'System Administrator',
    search_clubs: 'SEARCH CLUBS...',
    register_club: 'Register New Club',
    members_count: 'Members',
    view: 'View',
    status_system: 'SYSTEM STATUS: NOMINAL // BRS CLUB PLATFORM',
    file_path: 'FILE_PATH: /BRS/CLUBS/PLATFORM.MD',
    auth_error: 'Authentication failed. Please check credentials.',
    total_clubs: 'Total Clubs',
    active_members: 'Active Members',
    pending_apps: 'Pending Approvals',
    events_week: 'Events This Week',
    dist_type: 'Club Distribution by Type',
    act_trend: 'Activity Trend (This Week)',
    navigation: 'Navigation',
    logout: 'Logout',
    budget_forms: 'Budget & Forms',
    venue_res: 'Venue Reservation',
    select_venue: 'Select Venue',
    date: 'Date',
    time: 'Time',
    purpose: 'Purpose',
    submit_res: 'Submit Reservation Request',
    upload_forms: 'Upload Completed Forms',
    back_to_dir: 'Back to Directory',
    my_clubs: 'My Clubs',
    about_club: 'About this Club',
    recent_act: 'Recent Activities',
    req_submitted: 'Request Submitted to Admin',
    edit_locked: 'Edit Locked - Permission Denied',
    uploaded: 'File Uploaded Successfully',
    cancel: 'Cancel',
    submit: 'Submit',
    club_name: 'Club Name',
    name: 'Full Name',
    grade_class: 'Grade & Class',
    welcome_title: 'System Registration Complete',
    welcome_msg: 'Your profile has been created successfully. Welcome to the platform.',
    ok: 'Acknowledge',
    admin_tools: 'Admin Tools',
    export_clubs: 'Export Clubs (CSV)',
    export_apps: 'Export Approvals (CSV)',
    export_success: 'Data exported successfully',
    delete_club: 'Delete Club',
    ai_assistant: 'Nexus AI Assistant',
    ai_placeholder: 'ASK SYSTEM A QUESTION...',
    ai_generate: 'Generate with AI',
    ai_thinking: 'SYSTEM THINKING...',
    ai_intro: 'How can I assist with your organizational objectives today?',
    ai_insights: 'Nexus AI Insights',
    // Table headers
    th_id: 'ID',
    th_type: 'Type',
    th_applicant: 'Applicant & Details',
    th_date: 'Date Submitted',
    th_status: 'Status',
    th_actions: 'Actions',
    th_student_id: 'Student ID',
    th_name: 'Name',
    th_role: 'Role',
    th_department: 'Department',
    th_join_date: 'Join Date',
    // Form fields
    category: 'Category',
    description: 'Description',
    club_image: 'Club Logo / Image',
    // Approvals
    admin_req: 'ADMIN REQ',
    processed: 'PROCESSED',
    // Confirmations
    are_you_sure: 'Are you sure?',
    confirm_delete: 'CONFIRM DELETE',
    confirm: 'CONFIRM',
    purge_data: 'PURGE SYSTEM DATA',
    // Loading
    loading: 'Initializing System...',
    no_members: 'No Members Found',
  },
  zh: {
    platform_overview: '平台概览',
    club_directory: '社团风采展示',
    approvals: '审批管理',
    members: '成员管理',
    resources: '资源申请',
    login_title: '社团管理平台',
    login_subtitle: '北京王府学校社团管理平台 // 需要登录',
    email: '电子邮箱或用户名',
    password: '密码',
    login_btn: '登 录',
    signup_btn: '注 册',
    switch_signup: '还没有账号？点击注册',
    switch_login: '已有账号？点击登录',
    admin_user: '管理员',
    sys_admin: '系统管理员',
    search_clubs: '搜索社团...',
    register_club: '注册新社团',
    members_count: '名成员',
    view: '查看详情',
    status_system: '系统状态：正常 // 北京王府学校社团平台',
    file_path: '文件路径: /BRS/社团/平台.MD',
    auth_error: '身份验证失败或者未启用邮箱登录，请检查控制台设置。',
    total_clubs: '社团总数',
    active_members: '活跃成员',
    pending_apps: '待审批',
    events_week: '本周活动',
    dist_type: '各类型社团分布',
    act_trend: '活跃度趋势 (本周)',
    navigation: '导航菜单',
    logout: '退出登录',
    budget_forms: '预算与表格',
    venue_res: '场地预约',
    select_venue: '选择场地',
    date: '日期',
    time: '时间',
    purpose: '申请事由',
    submit_res: '提交预约申请',
    upload_forms: '上传已填写的表格',
    back_to_dir: '返回社团目录',
    my_clubs: '我的社团',
    about_club: '关于本社团',
    recent_act: '近期活动',
    req_submitted: '请求已提交给管理员',
    edit_locked: '编辑锁定 - 权限被拒绝',
    uploaded: '文件已成功上传',
    cancel: '取消',
    submit: '提交',
    club_name: '社团名称',
    name: '姓名',
    grade_class: '年级 & 班级',
    welcome_title: '注册成功',
    welcome_msg: '欢迎加入系统，您的账号已成功创建并激活。',
    ok: '进入系统',
    admin_tools: '管理工具',
    export_clubs: '导出社团 (CSV表格)',
    export_apps: '导出审批 (CSV表格)',
    export_success: '数据导出成功',
    delete_club: '解散并删除社团',
    ai_assistant: 'Nexus AI 助手',
    ai_placeholder: '向系统提问...',
    ai_generate: '由 AI 生成',
    ai_thinking: '系统思考中...',
    ai_intro: '今天我能如何协助您的组织目标？',
    ai_insights: 'Nexus AI 智能分析',
    // Table headers
    th_id: '编号',
    th_type: '类型',
    th_applicant: '申请人 & 详情',
    th_date: '提交日期',
    th_status: '状态',
    th_actions: '操作',
    th_student_id: '学号',
    th_name: '姓名',
    th_role: '角色',
    th_department: '院系',
    th_join_date: '加入日期',
    // Form fields
    category: '类别',
    description: '描述',
    club_image: '社团图片',
    // Approvals
    admin_req: '需管理员审核',
    processed: '已处理',
    // Confirmations
    are_you_sure: '确定吗？',
    confirm_delete: '确认删除',
    confirm: '确认',
    purge_data: '清空所有数据',
    // Loading
    loading: '正在初始化系统...',
    no_members: '暂无成员',
  }
};

type Lang = 'en' | 'zh';
const LanguageContext = createContext<{lang: Lang, t: (key: keyof typeof dict['en']) => string}>({
  lang: 'en',
  t: (key) => key
});
const useTranslation = () => useContext(LanguageContext);

// Activity trend — computed from real approval data
const computeActivityData = (approvals: any[]) => {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const today = new Date();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dayStr = d.toISOString().split('T')[0];
    const count = approvals.filter(a => {
      const approvalDate = a.date || a.created_at;
      return approvalDate && String(approvalDate).split('T')[0] === dayStr;
    }).length;
    result.push({ name: days[d.getDay() === 0 ? 6 : d.getDay() - 1], activities: count });
  }
  return result;
};

const AIAssistant = ({ onClose }: { onClose: () => void }) => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: 'user' | 'ai', text: string}[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    try {
      const response = await askAI(userMsg, "Context: Currently in the Beijing Royal School (BRS) Club Management Platform.");
      setMessages(prev => [...prev, { role: 'ai', text: response }]);
    } catch {
      setMessages(prev => [...prev, { role: 'ai', text: 'SYSTEM ERROR: Failed to connect to AI service.' }]);
    }
    setLoading(false);
  };

  return (
    <motion.div 
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      className="fixed top-0 right-0 h-full w-80 bg-bg border-l-2 border-line z-50 flex flex-col shadow-[-10px_0px_0px_0px_rgba(20,20,20,0.1)]"
    >
      <div className="p-4 border-b border-line flex justify-between items-center bg-ink text-bg">
        <div className="flex items-center font-mono text-[11px] font-bold uppercase tracking-widest">
          <Sparkles className="w-4 h-4 mr-2" />
          {t('ai_assistant')}
        </div>
        <button onClick={onClose} className="hover:text-accent">
          <XCircle className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 font-sans text-[13px]">
        <div className="p-3 bg-ink/5 border border-line/20 italic opacity-80">
          {t('ai_intro')}
        </div>
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 border border-line ${m.role === 'user' ? 'bg-bg' : 'bg-ink text-bg shadow-[4px_4px_0px_0px_#FF4400]'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="p-3 border border-line bg-bg animate-pulse font-mono text-[10px]">
              {t('ai_thinking')}
            </div>
          </div>
        )}
      </div>

      <form onSubmit={handleSend} className="p-4 border-t border-line bg-bg">
        <div className="relative">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('ai_placeholder')}
            rows={2}
            className="w-full border border-line bg-transparent p-3 pr-10 font-mono text-[11px] focus:outline-none focus:border-accent resize-none"
          />
          <button type="submit" className="absolute right-2 bottom-2 text-ink hover:text-accent">
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </motion.div>
  );
};

const DashboardTab = ({ clubs, approvals }: { clubs: any[], approvals: any[] }) => {
  const { t } = useTranslation();
  const [insight, setInsight] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Calculate dynamic club types
  const typeCount = clubs.reduce((acc: any, club: any) => {
    const type = club.type || 'Other';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  // Generate Insight based on real data (2s debounce)
  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      if (cancelled) return;
      setIsGenerating(true);
      const totalClubs = clubs.length;
      const totalMembers = clubs.reduce((acc, c) => acc + (Number(c.members_count) || 1), 0);
      const pendingApps = approvals.filter(a => a.status === 'Pending Review').length;
      
      const statsSummary = `\n        System Stats:\n        - Total Clubs: ${totalClubs}\n        - Total Members: ${totalMembers}\n        - Pending Approvals: ${pendingApps}\n        - Categories: ${JSON.stringify(typeCount)}\n      `;

      if (totalClubs === 0 && pendingApps === 0) {
        setInsight("System core is purged. Awaiting initial organizational registration requests to begin analysis.");
      } else {
        try {
          const prompt = `Based on these real-time high school club statistics from Beijing Royal School, generate a single-sentence professional administrative insight. Do not invent data outside of what is provided. ${statsSummary}`;
          const result = await askAI(prompt);
          setInsight(result);
        } catch (e) { /* ignore */ }
      }
      if (!cancelled) setIsGenerating(false);
    }, 2000);

    return () => { cancelled = true; clearTimeout(timer); };
  }, [clubs, approvals]);
  
  const dynamicClubTypesData = Object.keys(typeCount).map(key => ({
    name: key,
    count: typeCount[key]
  }));
  
  // Provide empty state if no clubs
  const finalClubTypesData = dynamicClubTypesData.length > 0 ? dynamicClubTypesData : [{ name: 'None', count: 0 }];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[1px] bg-line border border-line">
        {[
          { label: t('total_clubs'), value: clubs.length, icon: Users },
          { label: t('active_members'), value: clubs.reduce((acc, c) => acc + (Number(c.members_count) || 1), 0), icon: Users },
          { label: t('pending_apps'), value: approvals.filter(a => a.status === 'Pending Review').length, icon: Clock },
        ].map((stat, i) => (
          <div key={i} className="bg-bg p-5 flex flex-col">
            <div className="font-mono text-[9px] uppercase opacity-60 mb-4 flex justify-between items-center">
              {stat.label}
              <stat.icon className="w-4 h-4" />
            </div>
            <div className="font-serif italic text-3xl">{stat.value}</div>
          </div>
        ))}
      </div>

      <motion.div 
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="bg-accent text-bg p-6 border-2 border-line shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex items-start"
      >
        <Sparkles className="w-8 h-8 mr-4 mt-1 shrink-0" />
        <div>
          <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest mb-2 opacity-80">{t('ai_insights')}</h3>
          <p className="font-serif italic text-xl">
            {isGenerating ? t('ai_thinking') : insight}
          </p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-line border border-line">
        <div className="bg-bg flex flex-col">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest p-3 border-b border-line opacity-60 flex items-center">
            <BarChart3 className="w-3 h-3 mr-2" />
            {t('dist_type')}
          </div>
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <BarChart data={finalClubTypesData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 10, fill: '#141414'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 10, fill: '#141414'}} />
                <Tooltip cursor={{fill: 'rgba(20,20,20,0.1)'}} contentStyle={{borderRadius: 0, border: '1px solid #141414', backgroundColor: '#E4E3E0', fontFamily: 'monospace', fontSize: 10}} />
                <Bar dataKey="count" fill="#141414" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-bg flex flex-col">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest p-3 border-b border-line opacity-60 flex items-center">
            <Calendar className="w-3 h-3 mr-2" />
            {t('act_trend')}
          </div>
          <div className="h-64 p-4">
            <ResponsiveContainer width="100%" height="100%" minHeight={1}>
              <LineChart data={computeActivityData(approvals)}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414" opacity={0.2} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 10, fill: '#141414'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontFamily: 'monospace', fontSize: 10, fill: '#141414'}} />
                <Tooltip contentStyle={{borderRadius: 0, border: '1px solid #141414', backgroundColor: '#E4E3E0', fontFamily: 'monospace', fontSize: 10}} />
                <Line type="step" dataKey="activities" stroke="#FF4400" strokeWidth={2} dot={{r: 4, fill: '#FF4400', stroke: '#141414', strokeWidth: 1}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

const ClubsTab = ({ clubs, addApproval, showToast, isAdmin, onDeleteClub }: { clubs: any[], addApproval: (type: string, applicant: string) => void, showToast: (msg: string, type?: 'success'|'info'|'error') => void, isAdmin: boolean, onDeleteClub: (id: string)=>Promise<boolean|void> }) => {
  const { t } = useTranslation();
  const [selectedClub, setSelectedClub] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newClubName, setNewClubName] = useState('');
  const [newClubType, setNewClubType] = useState('Academic');
  const [newClubDesc, setNewClubDesc] = useState('');
  const [newClubImage, setNewClubImage] = useState('');

  const [clubMembers, setClubMembers] = useState<any[]>([]);
  
  // Fetch members when a club is selected
  const handleSelectClub = async (club: any) => {
    setSelectedClub(club);
    try {
      const members = await fetchClubMembers(club.id);
      setClubMembers(members || []);
    } catch {
      setClubMembers([]);
    }
  };

  const filteredClubs = clubs.filter((c: any) => c.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if(newClubName) {
       const regData = JSON.stringify({
         name: newClubName,
         type: newClubType,
         description: newClubDesc,
         image: newClubImage
       });
       addApproval('Registration', regData);
       showToast(t('req_submitted'), 'success');
       setShowModal(false);
       setNewClubName('');
       setNewClubDesc('');
       setNewClubImage('');
    }
  };

      const [isDeleting, setIsDeleting] = useState(false);

      if (selectedClub) {
        return (
          <div className="space-y-6">
            <button onClick={() => setSelectedClub(null)} className="font-mono text-[10px] uppercase hover:text-accent transition-colors flex items-center mb-4">
              <ChevronLeft className="w-3 h-3 mr-1" /> {t('back_to_dir')}
            </button>
            <div className="bg-bg border border-line">
              <div className="h-64 border-b border-line relative overflow-hidden bg-ink/5 flex items-center justify-center text-ink/20">
                {selectedClub.image ? (
                  <img src={selectedClub.image} alt={selectedClub.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center">
                    <Users className="w-16 h-16 mb-2 opacity-50" />
                    <span className="font-mono text-[12px] uppercase opacity-50">{selectedClub.name}</span>
                  </div>
                )}
                <div className="absolute top-4 right-4 bg-bg text-ink border border-line font-mono text-[11px] uppercase px-3 py-1 z-10">
                  {selectedClub.type}
                </div>
              </div>
              <div className="p-8">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="font-serif italic text-3xl mb-2">{selectedClub.name}</h2>
                    <div className="font-mono text-[11px] uppercase opacity-60 flex items-center">
                        <Users className="w-4 h-4 mr-2" /> {selectedClub.members_count || selectedClub.members || 1} {t('members_count')}
                    </div>
                    {selectedClub.president_name && (
                      <div className="font-mono text-[10px] uppercase opacity-50 mt-1">President: {selectedClub.president_name}</div>
                    )}
                  </div>
                  <span className="font-mono text-[10px] uppercase border border-line px-3 py-1 bg-ink text-bg">
                    {selectedClub.status}
                  </span>
                </div>

                {isAdmin && (
                   <div className="mb-6 flex items-center space-x-4">
                     {!isDeleting ? (
                       <button 
                         onClick={() => setIsDeleting(true)} 
                         className="font-mono text-[10px] uppercase border border-accent text-accent px-4 py-2 hover:bg-accent hover:text-bg transition-colors flex items-center font-bold"
                       >
                         <XCircle className="w-3 h-3 mr-2" />
                         {t('delete_club')}
                       </button>
                     ) : (
                       <div className="flex items-center space-x-2 bg-accent/10 p-2 border border-accent">
                         <span className="font-mono text-[10px] uppercase text-accent font-bold mr-4">Are you sure?</span>
                         <button 
                           onClick={async () => {
                             const success = await onDeleteClub(selectedClub.id);
                             if (success) {
                               setSelectedClub(null);
                             }
                             setIsDeleting(false);
                           }} 
                           className="font-mono text-[10px] uppercase bg-accent text-bg px-4 py-1 hover:opacity-80 transition-opacity font-bold"
                         >
                           CONFIRM DELETE
                         </button>
                         <button 
                           onClick={() => setIsDeleting(false)} 
                           className="font-mono text-[10px] uppercase bg-ink text-bg px-4 py-1 hover:opacity-80 transition-opacity font-bold"
                         >
                           CANCEL
                         </button>
                       </div>
                     )}
                   </div>
                )}

                {!isAdmin && (
                  <button
                    onClick={async () => {
                      try {
                        await applyToClub(selectedClub.id);
                        showToast('Application submitted!', 'success');
                      } catch (e: any) {
                        showToast(e.message, 'error');
                      }
                    }}
                    className="mb-6 font-mono text-[10px] uppercase bg-ink text-bg px-6 py-3 border border-line hover:bg-accent transition-colors font-bold"
                  >
                    Apply to Join
                  </button>
                )}

                <div className="mb-6">
                  <label className="font-mono text-[9px] uppercase bg-ink text-bg px-3 py-2 border border-line hover:bg-accent transition-colors cursor-pointer inline-flex items-center">
                    <Upload className="w-3 h-3 mr-2" />
                    Change Background
                    <input type="file" accept="image/*" className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const formData = new FormData();
                        formData.append('image', file);
                        try {
                          const token = sessionStorage.getItem('__auth_token');
                          const res = await fetch(`/api/upload/club/${selectedClub.id}`, {
                            method: 'POST',
                            headers: token ? { Authorization: `Bearer ${token}` } : {},
                            body: formData,
                          });
                          if (res.ok) {
                            const d = await res.json();
                            setSelectedClub({ ...selectedClub, image: d.image_url });
                            showToast('Background updated!', 'success');
                          } else {
                            const d = await res.json();
                            showToast(d.error || 'Upload failed', 'error');
                          }
                        } catch { showToast('Upload failed', 'error'); }
                      }}
                    />
                  </label>
                </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-8 pt-8 border-t border-line">
              <div>
                <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4">{t('about_club')}</h3>
                <div className="font-sans text-[14px] leading-relaxed space-y-4">
                  {selectedClub.description || "No official description has been indexed for this organizational unit."}
                  
                  {isAdmin && (
                    <button 
                      onClick={async () => {
                        const desc = await generateClubDescription(selectedClub.name, selectedClub.type);
                        try {
                          await updateClub(selectedClub.id, { description: desc });
                          showToast('Description optimized by AI', 'success');
                        } catch (e) {
                          showToast('Error updating record', 'error');
                        }
                      }}
                      className="flex items-center space-x-2 font-mono text-[9px] uppercase border border-line px-2 py-1 hover:bg-ink hover:text-bg transition-colors"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{t('ai_generate')}</span>
                    </button>
                  )}
                </div>
              </div>
                <div>
                 <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4">{t('recent_act')}</h3>
                 {clubMembers.length > 0 ? (
                   <ul className="space-y-2 font-mono text-[11px]">
                     {clubMembers.map((m: any, i: number) => (
                       <li key={i} className="flex items-center border border-line/20 p-2">
                         <div className="w-6 h-6 border border-line flex items-center justify-center font-serif text-[10px] mr-2 bg-ink text-bg shrink-0">
                           {(m.name || '?').charAt(0)}
                         </div>
                         <span>{m.name || 'Unknown'}</span>
                         {m.role === 'president' && (
                           <span className="ml-auto font-mono text-[8px] uppercase border border-accent text-accent px-1">社长</span>
                         )}
                       </li>
                     ))}
                   </ul>
                 ) : (
                   <p className="font-mono text-[11px] uppercase opacity-40 italic">No members yet</p>
                 )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative">
      <div className="flex justify-between items-center border-b border-line pb-4">
        <div className="relative w-64">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 opacity-50" />
          <input 
            type="text" 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('search_clubs')}
            className="w-full pl-9 pr-4 py-2 border border-line bg-transparent font-mono text-[11px] uppercase focus:outline-none focus:border-accent placeholder:text-ink/30"
          />
        </div>
        <button onClick={() => setShowModal(true)} className="bg-accent text-bg font-mono text-[10px] uppercase font-bold px-4 py-2 border border-line hover:bg-ink transition-colors flex items-center">
          <Plus className="w-3 h-3 mr-2" />
          {t('register_club')}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-line border border-line">
        {filteredClubs.map((club: any) => (
          <div key={club.id} onClick={() => handleSelectClub(club)} className="bg-bg flex flex-col group hover:bg-ink hover:text-bg transition-colors cursor-pointer">
            <div className="h-32 border-b border-line relative overflow-hidden bg-ink/5 flex items-center justify-center text-ink/20">
              {club.image ? (
                <img src={club.image} alt={club.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500" />
              ) : (
                <Users className="w-12 h-12 opacity-50" />
              )}
              <div className="absolute top-2 right-2 bg-bg text-ink border border-line font-mono text-[9px] uppercase px-1.5 py-0.5 z-10">
                {club.type}
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-serif italic text-lg mb-2">{club.name}</h3>
              <div className="font-mono text-[10px] uppercase opacity-60 mb-4 flex items-center">
                <Users className="w-3 h-3 mr-1" /> {club.members_count || 0} {t('members_count')}
              </div>
              <div className="flex justify-between items-center">
                <span className="font-mono text-[9px] uppercase border border-line px-1.5 py-0.5 group-hover:border-bg">
                  {club.status}
                </span>
                <span className="font-mono text-[10px] uppercase flex items-center group-hover:text-accent">
                  {t('view')} <ChevronRight className="w-3 h-3 ml-1" />
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-bg border-2 border-line p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <h2 className="font-serif italic text-2xl mb-6">{t('register_club')}</h2>
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block font-mono text-[9px] uppercase opacity-60 mb-2">{t('club_name')}</label>
                <input 
                  type="text" 
                  value={newClubName}
                  onChange={(e) => setNewClubName(e.target.value)}
                  placeholder="E.g., Quantum Computing Society"
                  className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent"
                  required
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase opacity-60 mb-2">{t("category")}</label>
                <select 
                  value={newClubType}
                  onChange={(e) => setNewClubType(e.target.value)}
                  className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent appearance-none"
                >
                  <option>Academic</option>
                  <option>Sports</option>
                  <option>Culture</option>
                  <option>Technology</option>
                  <option>Arts</option>
                </select>
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase opacity-60 mb-2">{t("description")}</label>
                <textarea 
                  value={newClubDesc}
                  onChange={(e) => setNewClubDesc(e.target.value)}
                  rows={3}
                  placeholder="Tell us about the club's objectives..."
                  className="w-full border border-line bg-transparent px-3 py-2 font-sans text-[13px] focus:outline-none focus:border-accent resize-none"
                />
              </div>
              <div>
                <label className="block font-mono text-[9px] uppercase opacity-60 mb-2">{t("club_image")}</label>
                <div className="flex flex-col space-y-2">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const img = new Image();
                          img.onload = () => {
                            const canvas = document.createElement('canvas');
                            const MAX_WIDTH = 800; // Resize to ensure it fits below 1MB
                            const MAX_HEIGHT = 800;
                            let width = img.width;
                            let height = img.height;

                            if (width > height) {
                              if (width > MAX_WIDTH) {
                                height *= MAX_WIDTH / width;
                                width = MAX_WIDTH;
                              }
                            } else {
                              if (height > MAX_HEIGHT) {
                                width *= MAX_HEIGHT / height;
                                height = MAX_HEIGHT;
                              }
                            }
                            canvas.width = width;
                            canvas.height = height;
                            const ctx = canvas.getContext('2d');
                            ctx?.drawImage(img, 0, 0, width, height);
                            // Compress image to base64 jpeg at 70% quality to avoid 1MB Firestore limit
                            setNewClubImage(canvas.toDataURL('image/jpeg', 0.7));
                          };
                          if (event.target?.result) {
                            img.src = event.target.result as string;
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }}
                    className="w-full font-mono text-[10px] file:bg-ink file:text-bg file:border-none file:px-3 file:py-1 file:mr-4 file:hover:bg-accent cursor-pointer"
                  />
                  {newClubImage && (
                    <div className="w-20 h-20 border border-line relative group">
                      <img src={newClubImage} className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setNewClubImage('')}
                        className="absolute -top-2 -right-2 bg-accent text-bg rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex space-x-4 pt-4 border-t border-line">
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 font-mono text-[10px] uppercase font-bold py-2 border border-line hover:bg-ink hover:text-bg transition-colors">
                  {t('cancel')}
                </button>
                <button type="submit" className="flex-1 font-mono text-[10px] uppercase font-bold py-2 bg-ink text-bg hover:bg-accent transition-colors">
                  {t('submit')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// Skipped detailed translations inside Approvals/Members/Resources to save space, but basic structure is intact
const ApprovalsTab = ({ approvals, onApprove, onReject, isAdmin }: { approvals: any[], onApprove: (id: string) => void, onReject: (id: string) => void, isAdmin: boolean }) => {
  const { t } = useTranslation();
  return (
    <div className="border border-line flex flex-col bg-bg">
      <div className="font-mono text-[10px] font-bold uppercase tracking-widest p-3 border-b border-line flex justify-between items-center opacity-80">
        <span>{t('pending_apps')}</span>
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse table-fixed">
          <thead>
            <tr className="font-mono text-[9px] uppercase opacity-60 border-b border-line">
              <th className="p-3 font-normal w-24">{t("th_id")}</th>
              <th className="p-3 font-normal w-32">{t("th_type")}</th>
              <th className="p-3 font-normal">{t("th_applicant")}</th>
              <th className="p-3 font-normal w-32">{t("th_date")}</th>
              <th className="p-3 font-normal w-28">{t("th_status")}</th>
              <th className="p-3 font-normal w-24 text-right">{t("th_actions")}</th>
            </tr>
          </thead>
          <tbody className="font-sans text-[13px]">
            {approvals.map((item, i) => (
              <tr key={item.id} className="border-b border-line/20 hover:bg-ink hover:text-bg transition-colors group">
                <td className="p-3 font-mono opacity-50 text-[11px] truncate">{String(item.id).substring(0, 8)}</td>
                <td className="p-3 truncate">{item.type}</td>
                <td className="p-3 truncate">
                  <div className="truncate font-medium">{item.applicant_name || item.applicantName || item.applicant}</div>
                  {item.details && (
                    <div className="opacity-60 text-[10px] mt-0.5 truncate">
                      {(() => {
                        try {
                          const parsed = JSON.parse(item.details);
                          if (item.type === 'Venue Booking') {
                            return `Venue: ${parsed.venue} | ${parsed.date} ${parsed.time}`;
                          } else if (item.type === 'Budget Request') {
                            return `Budget Form: ${parsed.file}`;
                          }
                          return `Req: ${parsed.name} - ${parsed.type}`;
                        } catch (e) {
                          return item.details;
                        }
                      })()}
                    </div>
                  )}
                </td>
                <td className="p-3 font-mono text-[11px] opacity-80 truncate">{item.date ? String(item.date).split('T')[0] : ''}</td>
                <td className="p-3 truncate">
                  <span className={`font-mono text-[9px] uppercase border border-line px-1.5 py-0.5 whitespace-nowrap ${
                    item.status === 'Approved' ? 'bg-bg text-ink group-hover:bg-ink group-hover:text-bg group-hover:border-bg' :
                    item.status === 'Rejected' ? 'bg-accent text-bg border-accent group-hover:border-accent' :
                    'group-hover:border-bg'
                  }`}>
                    {item.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  {item.status === 'Pending Review' ? (
                    isAdmin ? (
                      <div className="flex space-x-2">
                        <button onClick={() => onApprove(item.id)} className="p-1 border border-transparent hover:border-bg transition-colors" title="Approve">
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button onClick={() => onReject(item.id)} className="p-1 border border-transparent hover:border-bg transition-colors hover:text-accent" title="Reject">
                          <XCircle className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <span className="font-mono text-[9px] opacity-60 font-bold tracking-widest">
                        PENDING
                      </span>
                    )
                  ) : (
                    <span className="font-mono text-[9px] opacity-50">PROCESSED</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const MembersTab = ({ members, showToast, isAdmin, onDeleteMember }: { members: any[], showToast: (msg: string, type?: 'success'|'info'|'error') => void, isAdmin: boolean, onDeleteMember: (id: string) => void }) => {
  const { t } = useTranslation();
  const [deletingId, setDeletingId] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="border border-line flex flex-col bg-bg">
        <div className="overflow-x-auto w-full">
          <table className="w-full text-left border-collapse table-fixed">
            <thead>
              <tr className="font-mono text-[9px] uppercase opacity-60 border-b border-line">
                <th className="p-3 font-normal w-24">{t("th_student_id")}</th>
                <th className="p-3 font-normal">{t("th_name")}</th>
                <th className="p-3 font-normal w-24">{t("th_role")}</th>
                <th className="p-3 font-normal truncate">{t("th_department")}</th>
                <th className="p-3 font-normal w-32">{t("th_join_date")}</th>
                <th className="p-3 font-normal w-28 text-right">{t("th_actions")}</th>
              </tr>
            </thead>
            <tbody className="font-sans text-[13px]">
              {members.map((member) => (
                <tr key={member.uid || member.id} className="border-b border-line/20 hover:bg-ink hover:text-bg transition-colors group">
                  <td className="p-3 font-mono opacity-50 text-[11px] truncate">{String(member.id).substring(0, 8)}</td>
                  <td className="p-3 flex items-center truncate">
                    <div className="w-6 h-6 border border-line flex items-center justify-center font-serif italic text-[10px] mr-3 group-hover:border-bg shrink-0">
                      {member.name ? member.name.charAt(0) : '?'}
                    </div>
                    <span className="truncate">{member.name || 'Unknown'}</span>
                  </td>
                  <td className="p-3">
                    <span className="font-mono text-[9px] uppercase border border-line px-1.5 py-0.5 group-hover:border-bg">
                      {member.role || 'Member'}
                    </span>
                  </td>
                  <td className="p-3 truncate">{member.department || 'N/A'}</td>
                  <td className="p-3 font-mono text-[11px] opacity-80 truncate">{member.join_date || member.joinDate ? String(member.join_date || member.joinDate).split('T')[0] : 'N/A'}</td>
                  <td className="p-3 text-right">
                    <div className="flex space-x-3 items-center justify-end">
                      <button onClick={() => showToast(t('edit_locked'), 'error')} className="font-mono text-[10px] uppercase hover:text-accent transition-colors">Edit</button>
                      {isAdmin && (
                        deletingId === member.id ? (
                          <div className="flex items-center space-x-2">
                            <button onClick={() => { onDeleteMember(member.uid); setDeletingId(null); }} className="font-mono text-[9px] uppercase bg-accent text-bg px-2 py-0.5 font-bold">Conf</button>
                            <button onClick={() => setDeletingId(null)} className="font-mono text-[9px] uppercase bg-ink text-bg px-2 py-0.5">X</button>
                          </div>
                        ) : (
                          <button onClick={() => setDeletingId(member.id)} className="font-mono text-[10px] uppercase text-accent hover:opacity-70 transition-colors" title="Delete Member">
                            <XCircle className="w-4 h-4" />
                          </button>
                        )
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {members.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center font-mono text-[11px] uppercase opacity-50">
                    No Members Found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const MyClubsTab = ({ clubs, isAdmin, showToast }: { clubs: any[], isAdmin: boolean, showToast: (msg: string, type?: string) => void }) => {
  const { t } = useTranslation();
  const [myClubs, setMyClubs] = useState<any[]>([]);
  const [pendingApps, setPendingApps] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchMyMemberships(),
      ...clubs.map(c => fetchPendingApplications(c.id).catch(() => []))
    ]).then(([memberships, ...pendings]) => {
      setMyClubs(memberships || []);
      const apps: Record<string, any[]> = {};
      clubs.forEach((c, i) => { if (pendings[i]?.length) apps[c.id] = pendings[i]; });
      setPendingApps(apps);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []); // Only fetch on mount (user doesn't change during session)

  if (loading) return <div className="font-mono text-[11px] uppercase opacity-60 p-8">{t('ai_thinking')}</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[1px] bg-line border border-line">
        {myClubs.length === 0 ? (
          <div className="col-span-3 p-12 text-center font-mono text-[11px] uppercase opacity-50">
            Not a member of any clubs yet. Browse the Club Directory to join.
          </div>
        ) : (
          myClubs.map((club: any) => (
            <div key={club.id} className="bg-bg p-6 flex flex-col">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-serif italic text-lg">{club.name}</h3>
                <span className={`font-mono text-[9px] uppercase border px-2 py-0.5 ${club.my_role === 'president' ? 'border-accent text-accent bg-accent/5' : 'border-line'}`}>
                  {club.my_role === 'president' ? '社长' : t('members')}
                </span>
              </div>
              <div className="font-mono text-[10px] uppercase opacity-60 mb-4">{club.type}</div>
              <div className="font-sans text-[13px] opacity-70 mb-4 flex-1">{club.description?.slice(0, 80) || ''}</div>
              <div className="font-mono text-[9px] uppercase border-t border-line pt-3 opacity-50">
                {club.members_count || 1} {t('members_count')}
              </div>
            </div>
          ))
        )}
      </div>
      {Object.entries(pendingApps).map(([clubId, applications]) => {
        const club = clubs.find(c => c.id === clubId);
        const isPresident = myClubs.find(c => c.id === clubId)?.my_role === 'president';
        if (!club) return null;
        if (!isPresident && !isAdmin) return null;
        return (
          <div key={clubId} className="border border-line bg-bg p-6">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-widest opacity-60 mb-4">
              Pending — {club.name} {isAdmin && !isPresident && '(Admin View)'}
            </h3>
            <div className="space-y-2">
              {applications.map((app: any) => (
                <div key={app.id} className="flex items-center justify-between border border-line/20 p-3">
                  <span className="font-mono text-[11px]">{app.applicant_name}</span>
                  {isPresident ? (
                    <div className="flex space-x-2">
                      <button onClick={async () => {
                        await approveMembership(app.id, 'active');
                        showToast('Approved', 'success');
                        setPendingApps(prev => ({ ...prev, [clubId]: prev[clubId].filter(a => a.id !== app.id) }));
                      }} className="font-mono text-[9px] uppercase bg-ink text-bg px-3 py-1 hover:bg-accent">Approve</button>
                      <button onClick={async () => {
                        await approveMembership(app.id, 'rejected');
                        showToast('Rejected', 'success');
                        setPendingApps(prev => ({ ...prev, [clubId]: prev[clubId].filter(a => a.id !== app.id) }));
                      }} className="font-mono text-[9px] uppercase border border-line px-3 py-1 hover:bg-accent hover:text-bg">Reject</button>
                    </div>
                  ) : (
                    <span className="font-mono text-[9px] uppercase opacity-50">Pending Review</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

const ResourcesTab = ({ addApproval, showToast, userName }: { addApproval: (type: string, applicant: string) => void, showToast: (msg: string, type?: 'success'|'info'|'error') => void, userName: string }) => {
  const { t } = useTranslation();
  
  const [venue, setVenue] = useState('MAIN AUDITORIUM');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [purpose, setPurpose] = useState('');
  
  const handleVenueSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if(!date || !time || !purpose) return showToast('Please fill all fields', 'error');
    const detailsObj = { venue, date, time, purpose };
    addApproval('Venue', JSON.stringify(detailsObj));
    showToast(t('req_submitted'), 'success');
    setDate(''); setTime(''); setPurpose(''); setVenue('MAIN AUDITORIUM');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
       const detailsObj = { file: file.name, type: 'Budget Document' };
       addApproval('Budget', JSON.stringify(detailsObj));
       showToast(t('uploaded'), 'success');
       e.target.value = ''; // reset input
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-[1px] bg-line border border-line">
      <div className="bg-bg p-6 flex flex-col">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest border-b border-line pb-3 mb-6 opacity-80 flex justify-between items-center">
          <span className="flex items-center"><MapPin className="w-3 h-3 mr-2" /> {t('venue_res')}</span>
        </div>
        
        <form onSubmit={handleVenueSubmit} className="space-y-4">
          <div>
            <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('select_venue')}</label>
            <select 
              required 
              value={venue}
              onChange={e => setVenue(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] uppercase focus:outline-none focus:border-accent appearance-none rounded-none"
            >
              <option value="MAIN AUDITORIUM">MAIN AUDITORIUM</option>
              <option value="STUDENT CENTER ROOM 101">STUDENT CENTER ROOM 101</option>
              <option value="GYMNASIUM">GYMNASIUM</option>
              <option value="OUTDOOR FIELD">OUTDOOR FIELD</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('date')}</label>
              <input 
                required 
                type="date" 
                value={date}
                onChange={e => setDate(e.target.value)}
                className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] uppercase focus:outline-none focus:border-accent rounded-none appearance-none" 
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('time')}</label>
              <input 
                required 
                type="time" 
                value={time}
                onChange={e => setTime(e.target.value)}
                className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] uppercase focus:outline-none focus:border-accent rounded-none appearance-none" 
              />
            </div>
          </div>
          <div>
            <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('purpose')}</label>
            <textarea 
              required 
              rows={3} 
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full border border-line bg-transparent px-3 py-2 font-sans text-[13px] focus:outline-none focus:border-accent resize-none rounded-none appearance-none"
            ></textarea>
          </div>
          <button type="submit" className="w-full bg-ink text-bg font-mono text-[10px] uppercase font-bold py-3 border border-line hover:bg-accent transition-colors mt-2">
            {t('submit_res')}
          </button>
        </form>
      </div>
  
      <div className="bg-bg p-6 flex flex-col">
        <div className="font-mono text-[10px] font-bold uppercase tracking-widest border-b border-line pb-3 mb-6 opacity-80 flex items-center">
          <FileText className="w-3 h-3 mr-2" /> {t('budget_forms')}
        </div>
        
        <div className="space-y-2">
          {[
            { name: 'Annual Budget Template.xlsx', size: '245 KB' },
            { name: 'Activity Sponsorship Form.docx', size: '1.2 MB' },
          ].map((file, i) => (
            <div key={i} className="flex items-center justify-between p-3 border border-line hover:bg-ink hover:text-bg transition-colors group cursor-pointer">
              <div className="flex items-center">
                <div className="w-8 h-8 border border-line flex items-center justify-center mr-3 group-hover:border-bg">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="font-sans text-[13px]">{file.name}</p>
                  <p className="font-mono text-[9px] uppercase opacity-50">{file.size}</p>
                </div>
              </div>
            </div>
          ))}
          <div className="pt-4 mt-4 border-t border-line relative">
            <input 
              type="file" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
              title="Upload Completed Forms" 
            />
            <button type="button" className="w-full border border-dashed border-line text-ink hover:border-accent hover:text-accent font-mono text-[10px] uppercase font-bold py-4 transition-colors flex items-center justify-center rounded-none relative z-0">
              <Upload className="w-4 h-4 mr-2" />
              {t('upload_forms')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

function MainApp() {
  const { user, profile, loading, loginWithEmail, signupWithEmail, logout: authLogout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const { t, lang } = useTranslation();

  // Auth local state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [signUpName, setSignUpName] = useState('');
  const [gradeClass, setGradeClass] = useState('');
  const [isLoginFlow, setIsLoginFlow] = useState(true);
  const [authError, setAuthError] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAI, setShowAI] = useState(false);

  // Approvals State
  const [approvals, setApprovals] = useState<any[]>([]);
  const [clubs, setClubs] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const refreshData = async () => {
    if (!profile) return;
    try {
      const [clubsData, approvalsData, usersData] = await Promise.all([
        fetchClubs(),
        fetchApprovals(isAdmin ? undefined : user?.uid),
        isAdmin ? fetchUsers() : Promise.resolve([]),
      ]);
      setClubs(clubsData);
      setApprovals(approvalsData);
      setMembers(usersData);
    } catch (err) {
      console.error('Data load error:', err);
    }
  };
  
  // Connect to backend API
  useEffect(() => {
    refreshData();
  }, [profile]);
  
  const isAdmin = profile?.role === 'admin';

  const handleLogout = () => {
    authLogout();
  };

  const handleSystemPurge = async () => {
    if (!isAdmin) return;
    
    setToast({ message: "PURGE INITIATED...", type: "info" });
    
    try {
      const clubs = await fetchClubs();
      for (const c of clubs) {
        await apiDeleteClub(c.id);
      }

      const approvals = await fetchApprovals();
      for (const a of approvals) {
        await updateApproval(a.id, { status: 'Rejected' });
      }

      const users = await fetchUsers();
      for (const u of users) {
        if (u.uid !== user?.uid) {
          await apiDeleteUser(u.uid);
        }
      }

      showToast("SYSTEM PURGED: ALL DATA ERASED", "success");
      void refreshData();
    } catch (error) {
      console.error("Purge Error", error);
      showToast("PURGE FAILED: CHECK PERMISSIONS", "error");
    }
  };

  const handleDeleteClub = async (id: string) => {
    try {
      await apiDeleteClub(id);
      setClubs(prev => prev.filter(c => c.id !== id));
      showToast('Club permanently deleted', 'success');
      return true;
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error');
      return false;
    }
  };

  const handleDeleteMember = async (uid: string) => {
    try {
      await apiDeleteUser(uid);
      setMembers(prev => prev.filter(m => m.uid !== uid));
      showToast('Member removed from system', 'success');
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error');
    }
  };

  const [processingApps, setProcessingApps] = useState<Set<string>>(new Set());

  const handleApprove = async (id: string) => {
    if (processingApps.has(id)) return;
    const approval = approvals.find((a: any) => a.id === id);
    if (!approval || approval.status !== 'Pending Review') return;
    
    setProcessingApps(prev => new Set(prev).add(id));

    try {
      if (approval.type === 'Club Registration') {
        let clubData: any = {
          name: approval.details || 'Unknown Club',
          type: 'Academic',
          status: 'Active',
          president_id: approval.applicant_id,
          members_count: 1
        };

        try {
          const parsed = JSON.parse(approval.details);
          clubData = { ...clubData, name: parsed.name, type: parsed.type, description: parsed.description, image: parsed.image };
        } catch (e) {}

        await apiCreateClub(clubData);
      }
      await updateApproval(id, { status: 'Approved' });
      setApprovals(prev => prev.map((a: any) => a.id === id ? { ...a, status: 'Approved' } : a));
      void refreshData();
      showToast('Approved successfully', 'success');
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      setProcessingApps(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };
  
  const handleReject = async (id: string) => {
    if (processingApps.has(id)) return;
    
    setProcessingApps(prev => new Set(prev).add(id));
    try {
      await updateApproval(id, { status: 'Rejected' });
      setApprovals(prev => prev.map((a: any) => a.id === id ? { ...a, status: 'Rejected' } : a));
      showToast('Rejected successfully', 'success');
    } catch (error: any) {
      showToast('Error: ' + error.message, 'error');
    } finally {
      setProcessingApps(prev => { const next = new Set(prev); next.delete(id); return next; });
    }
  };

  const handleAddApproval = async (type: string, applicant: string) => {
    if (!profile) return;
    const payload = {
      type: type === 'Registration' ? 'Club Registration' : (type === 'Venue' ? 'Venue Booking' : 'Budget Request'),
      applicant_id: profile.uid,
      applicant_name: profile.name,
      status: 'Pending Review',
      details: applicant,
    };
    try {
      await createApproval(payload);
      const data = await fetchApprovals(isAdmin ? undefined : profile.uid);
      setApprovals(data);
    } catch (e: any) {
      showToast('Error: ' + (e.message || 'Permission denied'), 'error');
    }
  };

  const handleExportCSV = (data: any[], filename: string) => {
    if (!data || data.length === 0) {
      showToast('No data to export', 'info');
      return;
    }
    const headers = Object.keys(data[0]).join(',');
    const rows = data.map(obj => 
      Object.values(obj).map(v => {
        let str = String(v);
        if (typeof v === 'object' && v !== null) {
          try { str = JSON.stringify(v); } catch(e) { }
        }
        return `"${str.replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    
    try {
      const csvContent = `\uFEFF${headers}\n${rows}`;
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 100);
      document.body.removeChild(link);
      showToast(t('export_success'), 'success');
    } catch (e: any) {
      console.error(e);
      showToast('Export error: ' + e.message, 'error');
    }
  };

  const [toast, setToast] = useState<{message: string, type: string} | null>(null);
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Real-time clock state
  const [currentTime, setCurrentTime] = useState(new Date());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())} // ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
  };

  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  if (loading) {
    return (
      <div className="h-screen w-full bg-bg text-ink font-sans border-8 border-ink flex items-center justify-center">
        <div className="font-mono text-[11px] uppercase animate-pulse">Initializing System...</div>
      </div>
    );
  }

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    try {
      if (isLoginFlow) {
        await loginWithEmail(email, password);
      } else {
        await signupWithEmail(email, password, signUpName || email.split('@')[0]);
        setShowWelcome(true);
      }
    } catch (err: any) {
      setAuthError(err.message || t('auth_error'));
    }
  };

  if (!user || !profile) {
    return (
      <div className="h-screen w-full bg-bg text-ink font-sans border-8 border-ink flex flex-col items-center justify-center relative">
        <div className="max-w-md w-full border border-line bg-bg p-8 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] relative">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 border-2 border-line flex items-center justify-center bg-ink text-bg">
              <Award className="w-8 h-8" />
            </div>
          </div>
          <h1 className="font-serif italic text-3xl text-center mb-2">{t('login_title')}</h1>
          <p className="font-mono text-[11px] uppercase opacity-60 text-center mb-6">{t('login_subtitle')}</p>
          
          {authError && (
            <div className="bg-red-100 border border-red-400 text-red-700 font-mono text-[10px] p-3 mb-6">
              {authError}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4 mb-6">
            <div>
              <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('email')}</label>
              <input 
                type="text" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" 
              />
            </div>
            <div>
              <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('password')}</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" 
              />
            </div>
            {!isLoginFlow && (
              <>
                <div>
                  <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('name')}</label>
                  <input 
                    type="text" 
                    value={signUpName}
                    onChange={(e) => setSignUpName(e.target.value)}
                    required
                    className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" 
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{t('grade_class')}</label>
                  <input 
                    type="text" 
                    value={gradeClass}
                    onChange={(e) => setGradeClass(e.target.value)}
                    required
                    className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" 
                  />
                </div>
              </>
            )}
            <button type="submit" className="w-full bg-ink text-bg font-mono text-[11px] uppercase font-bold py-3 hover:bg-accent transition-colors">
              {isLoginFlow ? t('login_btn') : t('signup_btn')}
            </button>
          </form>

          <div className="flex items-center justify-between border-t border-line pt-6">
             <button onClick={() => setIsLoginFlow(!isLoginFlow)} className="font-mono text-[10px] uppercase opacity-60 hover:text-accent hover:opacity-100 transition-colors">
                {isLoginFlow ? t('switch_signup') : t('switch_login')}
             </button>
             <span className="font-mono text-[10px] uppercase opacity-40">v0.4.3</span>
          </div>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'dashboard', label: t('platform_overview'), icon: LayoutDashboard },
    { id: 'clubs', label: t('club_directory'), icon: Users },
    { id: 'approvals', label: t('approvals'), icon: CheckCircle },
    { id: 'members', label: t('members'), icon: Users },
    { id: 'myclubs', label: t('my_clubs'), icon: Award },
    { id: 'resources', label: t('resources'), icon: Calendar },
  ];

  return (
    <div className="h-screen w-full bg-bg text-ink font-sans border-8 border-ink flex flex-col overflow-hidden relative">
      {toast && (
        <div className={`absolute bottom-6 right-6 z-50 px-5 py-4 font-mono text-[11px] uppercase border-2 shadow-[6px_6px_0px_0px_rgba(20,20,20,1)] flex items-center transition-all ${toast.type === 'success' ? 'bg-[#E4E3E0] text-ink border-ink' : toast.type === 'error' ? 'bg-accent text-bg border-accent' : 'bg-ink text-[#E4E3E0] border-line'}`}>
          <Bell className="w-4 h-4 mr-3 shrink-0" />
          {toast.message}
        </div>
      )}
      <header className="h-24 border-b-2 border-line flex items-end justify-between px-6 pb-4 shrink-0">
        <div>
          <h1 className="font-serif italic text-3xl tracking-tight leading-none mb-1">{t('login_title')}</h1>
          <p className="font-mono text-[11px] uppercase opacity-60">{t('login_subtitle')}</p>
        </div>
        <div className="font-mono text-[11px] uppercase text-right flex items-center">
          <div className="mr-6 text-left">
            <p>REV NO: 0.4.3</p>
            <p>TIMESTAMP: {formatTime(currentTime)}</p>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-64 border-r border-line flex flex-col shrink-0">
          <div className="font-mono text-[10px] font-bold uppercase tracking-widest p-3 border-b border-line opacity-60">
            {t('navigation')}
          </div>
          <nav className="flex-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center space-x-3 px-4 py-3 border-b border-line font-mono text-[11px] uppercase transition-colors ${
                  activeTab === item.id 
                    ? 'bg-ink text-bg' 
                    : 'hover:bg-ink/10'
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            ))}
          </nav>
          
          {isAdmin && (
            <div className="border-t border-line pb-2">
              <div className="font-mono text-[9px] font-bold uppercase tracking-widest p-3 opacity-60">
                {t('admin_tools')}
              </div>
              <button onClick={() => handleExportCSV(clubs, `clubs_export_${new Date().getTime()}.csv`)} className="w-full flex items-center space-x-3 px-4 py-2 border-b border-line/50 font-mono text-[10px] uppercase hover:bg-ink hover:text-bg transition-colors">
                <span>{t('export_clubs')}</span>
              </button>
              <button onClick={() => handleExportCSV(approvals, `approvals_export_${new Date().getTime()}.csv`)} className="w-full flex items-center space-x-3 px-4 py-2 font-mono text-[10px] uppercase hover:bg-ink hover:text-bg transition-colors">
                <span>{t('export_apps')}</span>
              </button>
              {!showPurgeConfirm ? (
                <button onClick={() => setShowPurgeConfirm(true)} className="w-full flex items-center space-x-3 px-4 py-2 font-mono text-[10px] uppercase text-accent hover:bg-accent hover:text-bg transition-colors">
                  <XCircle className="w-3 h-3 mr-2" />
                  <span>{t('purge_data')}</span>
                </button>
              ) : (
                <div className="w-full flex flex-col space-y-2 p-2 border border-accent bg-accent/10">
                  <span className="font-mono text-[10px] uppercase text-accent font-bold text-center">{t('are_you_sure')}</span>
                  <div className="flex space-x-2">
                    <button onClick={() => { handleSystemPurge(); setShowPurgeConfirm(false); }} className="flex-1 bg-accent text-bg px-2 py-1 font-mono text-[9px] uppercase font-bold hover:opacity-80">{t('confirm')}</button>
                    <button onClick={() => setShowPurgeConfirm(false)} className="flex-1 bg-ink text-bg px-2 py-1 font-mono text-[9px] uppercase text-center hover:opacity-80">{t('cancel')}</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-4 border-t border-line">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 overflow-hidden">
                <div className="w-8 h-8 shrink-0 border border-line flex items-center justify-center font-serif italic text-lg bg-ink text-bg overflow-hidden">
                  {profile.avatar ? <img src={profile.avatar} alt="avatar" /> : (profile.name || '?').charAt(0)}
                </div>
                <div className="font-mono overflow-hidden">
                  <p className="text-[10px] font-bold uppercase truncate max-w-full">{profile.name}</p>
                  <p className="text-[9px] uppercase opacity-60">{profile.role}</p>
                </div>
              </div>
              <button onClick={handleLogout} className="p-2 hover:text-accent transition-colors ml-2 shrink-0" title={t('logout')}>
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </aside>

        <main className="flex-1 overflow-auto p-6">
          <div className="max-w-6xl mx-auto">
            {activeTab === 'dashboard' && <DashboardTab clubs={clubs} approvals={approvals} />}
            {activeTab === 'clubs' && <ClubsTab clubs={clubs} addApproval={handleAddApproval} showToast={showToast} isAdmin={isAdmin} onDeleteClub={handleDeleteClub} />}
            {activeTab === 'approvals' && <ApprovalsTab approvals={approvals} onApprove={handleApprove} onReject={handleReject} isAdmin={isAdmin} />}
            {activeTab === 'members' && <MembersTab members={members} showToast={showToast} isAdmin={isAdmin} onDeleteMember={handleDeleteMember} />}
            {activeTab === 'myclubs' && <MyClubsTab clubs={clubs} isAdmin={isAdmin} showToast={showToast} />}
            {activeTab === 'resources' && <ResourcesTab addApproval={handleAddApproval} showToast={showToast} userName={profile.name} />}
          </div>
        </main>
      </div>

      <footer className="h-10 border-t-2 border-line bg-[#D9D8D5] flex items-center justify-between px-6 font-mono text-[10px] uppercase shrink-0">
        <div>{t('status_system')}</div>
        <div>{t('file_path')}</div>
        <div>&copy; 2024 BEIJING ROYAL SCHOOL</div>
      </footer>

      {showWelcome && (
        <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-bg border-2 border-ink p-8 max-w-sm w-full text-center shadow-[8px_8px_0px_0px_rgba(20,20,20,1)]">
            <div className="flex justify-center mb-4 text-accent"><CheckCircle className="w-12 h-12" /></div>
            <h2 className="font-serif italic text-2xl mb-2">{t('welcome_title')}</h2>
            <p className="font-sans text-[13px] opacity-80 mb-6">{t('welcome_msg')}</p>
            <button onClick={() => setShowWelcome(false)} className="w-full bg-ink text-bg font-mono text-[11px] uppercase font-bold py-3 hover:bg-accent transition-colors">
              {t('ok')}
            </button>
          </div>
        </div>
      )}

      <AnimatePresence>
        {showAI && <AIAssistant onClose={() => setShowAI(false)} />}
      </AnimatePresence>

      {!showAI && (
        <motion.button
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          onClick={() => setShowAI(true)}
          className="fixed bottom-6 right-6 z-40 bg-accent text-bg p-4 border-2 border-line shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] hover:bg-ink transition-colors flex items-center justify-center font-bold"
        >
          <Sparkles className="w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

export default function App() {
  const [lang, setLang] = useState<Lang>('en');

  const t = (key: keyof typeof dict['en']) => {
    return dict[lang][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, t }}>
      <div className="relative">
        <div className="absolute top-4 right-4 z-50">
          <button 
            onClick={() => setLang(lang === 'en' ? 'zh' : 'en')} 
            className="font-mono text-[10px] uppercase border-2 border-ink bg-bg px-3 py-1.5 hover:bg-ink hover:text-bg transition-colors shadow-[2px_2px_0px_0px_rgba(20,20,20,1)]"
          >
            {lang === 'en' ? '中文' : 'ENGLISH'}
          </button>
        </div>
        <MainApp />
      </div>
    </LanguageContext.Provider>
  );
}
