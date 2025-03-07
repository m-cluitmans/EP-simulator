import { configureStore } from '@reduxjs/toolkit';
import cellReducer from './slices/cellSlice';
import tissueReducer from './slices/tissueSlice';
import arrhythmiaReducer from './slices/arrhythmiaSlice';

export const store = configureStore({
  reducer: {
    cell: cellReducer,
    tissue: tissueReducer,
    arrhythmia: arrhythmiaReducer,
  },
  // Enable this middleware for browser support
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Allow non-serializable data in the store
    }),
});

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch; 