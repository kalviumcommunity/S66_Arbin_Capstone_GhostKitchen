import api from "./api";

export const procurement = {
  list: async (resource) => (await api.get(`/procurement/${resource}`)).data,
  save: async (resource, body, id) => (await (id ? api.put(`/procurement/${resource}/${id}`, body) : api.post(`/procurement/${resource}`, body))).data,
  archive: async (resource, id) => (await api.delete(`/procurement/${resource}/${id}`)).data,
  setStatus: async (id, status) => (await api.patch(`/procurement/purchase-orders/${id}/status`, { status })).data,
  receive: async (id, lines, key) => (await api.post(`/procurement/purchase-orders/${id}/receive`, { lines }, { headers: { "Idempotency-Key": key } })).data,
  adjust: async (id, body, key) => (await api.post(`/procurement/ingredients/${id}/adjustments`, body, { headers: { "Idempotency-Key": key } })).data,
};
