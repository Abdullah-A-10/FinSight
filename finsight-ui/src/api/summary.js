import api from "./axios";

export const getDashboardSummary = (userId) => api.get(`/summary/${userId}`);

export const getCategoryBreakdown = (userId) =>
  api.get(`/summary/${userId}/categories`);

export const getInsights = (userId) => api.get(`/advisor/${userId}`);

export const runSimulation = (payload) => api.post("/simulate", payload);

export const getStrategies = (userId, years = 10) =>
  api.get(`/simulate/strategies/${userId}?years=${years}`);

export const getTransactions = (userId) =>
  api.get(`/transactions/user/${userId}`);

export const addTransaction = (payload) => api.post("/transactions", payload);

export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const getAccounts = (userId) => api.get(`/accounts/user/${userId}`);

export const getLifeEvents = (userId) => api.get(`/life-events/user/${userId}`);

export const addLifeEvent = (payload) => api.post("/life-events", payload);

export const deleteLifeEvent = (id) => api.delete(`/life-events/${id}`);

export const getBudgets = (userId) => api.get(`/budgets/user/${userId}`);

export const getBudgetStatus = (userId) =>
  api.get(`/budgets/user/${userId}/status`);

export const saveBudget = (payload) => api.post("/budgets", payload);

export const deleteBudget = (id) => api.delete(`/budgets/${id}`);

export const getStrategy = (userId) => {
  return api.get(`/users/strategy?userId=${userId}`);
};

export const updateStrategy = (userId, strategy) => {
  return api.post(`/users/strategy?userId=${userId}`, strategy);
};