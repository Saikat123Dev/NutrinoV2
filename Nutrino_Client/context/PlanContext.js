import { createContext, useContext } from 'react';

export const PlanContext = createContext(null);

export const usePlan = () => useContext(PlanContext);
