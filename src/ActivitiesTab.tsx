import React, { useState, useEffect } from 'react';
import { Plus, Calendar, ChevronRight, XCircle } from 'lucide-react';
import { fetchMyMemberships, fetchClubs } from './api';

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
      const d = await apiReq('/data/activities', { method: 'POST', body: JSON.stringify({ title: formTitle, description: formDesc, contact_info: formContact, join_link: formLink, primary_club_id: selectedClubId, needs_approval: formNeedsApproval }) });
      if (d.error) throw new Error(d.error);
      showToast(d.status === 'active' ? 'Activity published!' : 'Submitted for approval', 'success');
      setShowCreate(false);
      fetchActivities();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleJoin = async (activityId: string) => {
    try {
      const d = await apiReq('/data/activities/' + activityId + '/join', { method: 'POST' });
      if (d.error) throw new Error(d.error);
      showToast(d.status === 'active' ? 'Joined!' : 'Applied - awaiting approval', 'success');
      fetchActivities();
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  if (loading) return <div className="font-mono text-[11px] uppercase opacity-60 p-8">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="font-serif italic text-2xl">Activities</h2>
        <button onClick={() => setShowCreate(true)} className="font-mono text-[10px] uppercase bg-ink text-bg px-4 py-2 border border-line hover:bg-accent transition-colors flex items-center">
          <Plus className="w-3 h-3 mr-2" /> Create Activity
        </button>
      </div>
      <div className="grid grid-cols-1 gap-[1px] bg-line border border-line">
        {activities.length === 0 ? (
          <div className="p-12 text-center font-mono text-[11px] uppercase opacity-50">No activities yet. Create one!</div>
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
            <h2 className="font-serif italic text-2xl mb-6">Create Activity</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">Title *</label><input value={formTitle} onChange={e => setFormTitle(e.target.value)} required className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">Description *</label><textarea value={formDesc} onChange={e => setFormDesc(e.target.value)} rows={4} required className="w-full border border-line bg-transparent px-3 py-2 font-sans text-[13px] focus:outline-none focus:border-accent resize-none" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">Contact Info *</label><input value={formContact} onChange={e => setFormContact(e.target.value)} placeholder="Phone / WeChat / QQ" required className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">Join Link (optional)</label><input value={formLink} onChange={e => setFormLink(e.target.value)} placeholder="Group chat link" className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent" /></div>
              <div><label className="block font-mono text-[9px] uppercase opacity-60 mb-1">Host Club *</label>
                <select value={selectedClubId} onChange={e => setSelectedClubId(e.target.value)} required className="w-full border border-line bg-transparent px-3 py-2 font-mono text-[11px] focus:outline-none focus:border-accent">
                  <option value="">Select a club...</option>
                  {myClubs.map((c: any) => <option key={c.id} value={c.id}>{c.name}{c.my_role==='president'?' (President)':c.my_role==='admin'?' (Admin)':''}</option>)}
                </select>
              </div>
              <div className="flex items-center space-x-2"><input type="checkbox" id="needs_approval" checked={formNeedsApproval} onChange={e => setFormNeedsApproval(e.target.checked)} className="border border-line" /><label htmlFor="needs_approval" className="font-mono text-[10px] uppercase opacity-60">Require approval to join</label></div>
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