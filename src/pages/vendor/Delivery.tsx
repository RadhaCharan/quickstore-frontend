import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../services/api';
import { Truck, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

const STATUS_FLOW = ['PENDING', 'ASSIGNED', 'PICKED_UP', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function VendorDelivery() {
  const [agentModal, setAgentModal] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', phone: '' });
  const qc = useQueryClient();

  const { data: deliveries = [] } = useQuery({
    queryKey: ['deliveries'],
    queryFn: () => api.get('/delivery').then((r) => { const d = r.data; return Array.isArray(d) ? d : Array.isArray(d?.items) ? d.items : []; }),
    refetchInterval: 30_000,
  });

  const { data: agents = [] } = useQuery({
    queryKey: ['agents'],
    queryFn: () => api.get('/delivery/agents').then((r) => r.data),
  });

  const addAgent = useMutation({
    mutationFn: () => api.post('/delivery/agents', agentForm),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['agents'] });
      setAgentModal(false);
      setAgentForm({ name: '', phone: '' });
      toast.success('Delivery agent added');
    },
  });

  const assignAgent = useMutation({
    mutationFn: ({ deliveryId, agentId }: any) =>
      api.patch(`/delivery/${deliveryId}/assign`, { agentId }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Agent assigned');
    },
  });

  const updateDeliveryStatus = useMutation({
    mutationFn: ({ id, status }: any) => api.patch(`/delivery/${id}/status`, { status }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['deliveries'] });
      toast.success('Status updated');
    },
  });

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-bold text-gray-900">Delivery Management</h1>
        <button
          onClick={() => setAgentModal(true)}
          className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700"
        >
          <UserPlus size={16} /> Add Agent
        </button>
      </div>

      {/* Agents list */}
      <div className="bg-white rounded-xl border border-gray-100 p-4 mb-5">
        <p className="text-xs font-medium text-gray-500 uppercase mb-3">Delivery Agents ({agents.length})</p>
        {agents.length === 0 ? (
          <p className="text-sm text-gray-400">No agents yet. Add your first delivery agent.</p>
        ) : (
          <div className="flex gap-2 flex-wrap">
            {agents.map((a: any) => (
              <span key={a.id} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-full text-xs font-medium">
                {a.name} · {a.phone}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Deliveries */}
      <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Order', 'Status', 'Agent', 'Update Status', 'Assign Agent'].map((h) => (
                <th key={h} className="text-left px-4 py-3 text-xs font-medium text-gray-500 uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {deliveries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-gray-400">
                  <Truck size={32} className="mx-auto mb-2 text-gray-300" />
                  No deliveries yet
                </td>
              </tr>
            ) : (
              deliveries.map((d: any) => (
                <tr key={d.id} className="border-b border-gray-50">
                  <td className="px-4 py-3 font-medium">{d.order?.orderNumber}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs">{d.status}</span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{d.agent?.name || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && updateDeliveryStatus.mutate({ id: d.id, status: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Change status</option>
                      {STATUS_FLOW.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue=""
                      onChange={(e) => e.target.value && assignAgent.mutate({ deliveryId: d.id, agentId: e.target.value })}
                      className="border border-gray-200 rounded px-2 py-1 text-xs"
                    >
                      <option value="">Assign agent</option>
                      {agents.map((a: any) => (
                        <option key={a.id} value={a.id}>{a.name}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add agent modal */}
      {agentModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6">
            <h3 className="font-semibold mb-4">Add Delivery Agent</h3>
            <input
              type="text" placeholder="Name"
              value={agentForm.name}
              onChange={(e) => setAgentForm((f) => ({ ...f, name: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <input
              type="tel" placeholder="Phone"
              value={agentForm.phone}
              onChange={(e) => setAgentForm((f) => ({ ...f, phone: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
            <div className="flex gap-3">
              <button onClick={() => setAgentModal(false)} className="flex-1 border border-gray-200 rounded-lg py-2 text-sm">Cancel</button>
              <button onClick={() => addAgent.mutate()} className="flex-1 bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">Add</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
