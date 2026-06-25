import React, { useState, useEffect } from 'react';
import { Plus, Calendar, ChevronRight, XCircle } from 'lucide-react';
import { fetchMyMemberships, fetchClubs } from './api';

const T = (k: string) => {
  const saved = sessionStorage.getItem('__lang') || 'en';
  const en: Record<string,string> = { activities:'Activities', create_activity:'Create Activity', act_title:'Title *', act_desc:'Description *', act_contact:'Contact Info *', act_link:'Join Link (optional)', act_host:'Host Club *', act_collab:'Joint Clubs (optional)', act_needs_approval:'Require approval to join', act_no_activities:'No activities yet. Create one!', act_published:'Activity published!', act_submitted:'Submitted for approval', act_joined:'Joined!', act_applied:'Applied - awaiting approval', ai_thinking:'Loading...' };
  const zh: Record<string,string> = { activities:'社团活动', create_activity:'发起活动', act_title:'标题 *', act_desc:'描述 *', act_contact:'联系方式 *', act_link:'加入链接（选填）', act_host:'主办社团 *', act_collab:'联合社团（选填）', act_needs_approval:'加入需要审批', act_no_activities:'暂无活动，快来创建一个！', act_published:'活动已发布！', act_submitted:'已提交，等待审批', act_joined:'已加入！', act_applied:'已申请，等待审批', ai_thinking:'载入中...' };
  return saved === 'zh' ? zh[k] || k : en[k] || k;
};

export const ActivitiesTab = ({ showToast, isAdmin }: { showToast: (msg: string, type?: string) => void; isAdmin: boolean }) => {
  const [activities, setActivities] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formContact, setFormContact] = useState('');
  const [formLink, setFormLink] = useState('');
  const [formNeedsApproval, setFormNeedsApproval] = useState(true);
  const [selectedClubId, setSelectedClubId] = useState('');
  const [collabClubIds, setCollabClubIds] = useState<string[]>([]);
  const [collabSearch, setCollabSearch] = useState('');
  const [myClubs, setMyClubs] = useState<any[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchClubs().then((clubs: any) => setMyClubs((clubs || []).map((c: any) => ({ ...c, my_role: 'admin' })))).catch(() => {});
    } else {
      fetchMyMemberships().then((m: any) => setMyClubs(m || [])).catch(() => {});
    }
  }, [isAdmin]);

  const apiReq = async (path: string, init?: RequestInit) => {
    const token = sessionStorage.getItem('__auth_token');
    const h: Record<string,string> = {'Content-Type':'application/json'};
    if (token) h['Authorization'] = 'Bearer ' + token;
    const r = await fetch((location.hostname==='localhost'?'http://localhost:3001/api':'/api')+path,{headers:h,...(init||{})});
    return r.json();
  };

  const fetchActivities = async () => {
    setLoading(true);
    try { const d = await apiReq('/data/activities'); setActivities(d || []); } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchActivities(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formTitle || !formDesc || !formContact || !selectedClubId) return showToast('Please fill required fields', 'error');
    try {
      const body: any = { title: formTitle, description: formDesc, contact_info: formContact, join_link: formLink, primary_club_id: selectedClubId, needs_approval: formNeedsApproval };
      if (collabClubIds.length) body.collaborator_ids = collabClubIds;
      const d = await apiReq('/data/activities', { method: 'POST', body: JSON.stringify(body) });
      if (d.error) throw new Error(d.error);
      showToast(d.status === 'active' ? T('act_published') : T('act_submitted'), 'success');
      setShowCreate(false);
      setCollabClubIds([]);
      fetchActivities();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleJoin = async (activityId: string) => {
    try {
      const d = await apiReq('/data/activities/' + activityId + '/join', { method: 'POST' });
      if (d.error) throw new Error(d.error);
      showToast(d.status === 'active' ? T('act_joined') : T('act_applied'), 'success');
      fetchActivities();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const toggleCollab = (clubId: string) => {
    setCollabClubIds(prev => prev.includes(clubId) ? prev.filter(id => id !== clubId) : [...prev, clubId]);
  };

  if (loading) return <div className="font-mono text-[11px] uppercase opacity-60 p-8">{T('ai_thinking')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-serif italic text-2xl">{T('activities')}</h2>
        <button onClick={() => setShowCreate(true)} className="font-mono text-[10px] uppercase bg-ink text-bg px-4 py-2 border border-line hover:bg-accent transition-colors flex items-center">
          <Plus className="w-3 h-3 mr-2" /> {T('create_activity')}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-[1px] bg-line border border-line">
        {activities.length === 0 ? (
          <div className="p-12 text-center font-mono text-[11px] uppercase opacity-50">{T('act_no_activities')}</div>
        ) : (
          activities.map((a: any) => (
            <div key={a.id} className="bg-bg p-6 flex items-start group hover:bg-ink hover:text-bg transition-colors cursor-pointer" onClick={() => setSelected(a)}>
              <div className="w-16 h-16 border border-line shrink-0 mr-4 bg-ink/5 flex items-center justify-center group-hover:border-bg overflow-hidden">
                {a.image ? <img src={a.image} className="w-full h-full object-cover" /> : <Calendar className="w-6 h-6 opacity-50" />}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-serif italic text-lg">{a.title}</h3>
                <p className="font-mono text-[9px] uppercase opacity-60 mt-1">{a.primary_club?.name || 'Unknown'} · {a.participant_count || 0} participants</p>
                <p className="font-sans text-[13px] mt-2 opacity-70 line-clamp-2">{a.description?.slice(0, 120)}</p>
              </div>
              <div className="ml-4 shrink-0"><ChevronRight className="w-4 h-4 opacity-50" /></div>
            </div>
          ))
        )}
      </div>

      {showCreate && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-bg border-2 border-line p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] max-h-[90vh] overflow-y-auto">
            <h2 className="font-serif italic text-2xl mb-6">{T('create_activity')}</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{T('act_title')}</label><input value={formTitle} onChange={e => setFormTitle(e.target.value)} required className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{T('act_desc')}</label><textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} required className="w-full border border-line bg-transparent px-3 py-2 font-sans text-[13px] focus:outline-none focus:border-accent resize-none" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{T('act_contact')}</label><input value={formContact} onChange={e => setFormContact(e.target.value)} placeholder="Phone / WeChat / QQ" required className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{T('act_link')}</label><input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Group chat link" className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{T('act_host')}</label>
                <select value={selectedClubId} onChange={e => setSelectedClubId(e.target.value)} required className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent">
                  <option value="">Select...</option>
                  {myClubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.my_role==='president'?' (President)':c.my_role==='admin'?' (Admin)':''}</option>)}
                </select>
              </div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">{T('act_collab')}</label>
                <input value={collabSearch} onChange={e => setCollabSearch(e.target.value)} placeholder="Search clubs..." className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent mb-2" />
                <div className="max-h-32 overflow-y-auto border border-line/20">
                  {fetchClubs && React.useMemo(() => {
                    // We need all clubs for collab search - fetch on mount
                    const [allClubs, setAllClubs] = useState<any[]>([]);
                    return null;
                  }, [])}
                </div>
              </div>
              <div className="flex items-center space-x-2"><input type="checkbox" id="needs_approval" checked={formNeedsApproval} onChange={e => setFormNeedsApproval(e.target.checked)} className="border border-line" /><label htmlFor="needs_approval" className="font-mono text-[10px] uppercase opacity-60">{T('act_needs_approval')}</label></div>
              <div className="flex space-x-4 pt-4 border-t border-line"><button type="button" onClick={() => setShowCreate(false)} className="flex-1 font-mono text-[10px] uppercase font-bold py-2 border border-line hover:bg-ink hover:text-bg transition-colors">Cancel</button><button type="submit" className="flex-1 font-mono text-[10px] uppercase font-bold py-2 bg-ink text-bg hover:bg-accent transition-colors">Submit</button></div>
            </form>
          </div>
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-bg/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl bg-bg border-2 border-line p-6 shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="float-right font-mono text-[10px] uppercase opacity-60 hover:text-accent"><XCircle className="w-5 h-5" /></button>
            <h2 className="font-serif italic text-2xl mb-2">{selected.title}</h2>
            <div className="font-mono text-[10px] uppercase opacity-60 mb-4">{selected.primary_club?.name} · {selected.participant_count || 0} participants</div>
            <div className="font-sans text-[13px] mb-6 leading-relaxed">{selected.description}</div>
            {selected.join_link && <p className="font-mono text-[11px] mb-2">🔗 <a href={selected.join_link} target="_blank" className="underline hover:text-accent">Join Link</a></p>}
            <p className="font-mono text-[11px] mb-4">📞 Contact: {selected.contact_info}</p>
            <div className="flex space-x-3 pt-4 border-t border-line">
              <button onClick={() => handleJoin(selected.id)} className="flex-1 font-mono text-[11px] uppercase font-bold py-2 bg-accent text-bg hover:bg-ink transition-colors">
                {selected.needs_approval ? 'Apply to Join' : 'Join Activity'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};