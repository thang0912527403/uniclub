import { Navigate } from 'react-router';

export default function FundsTransactionsRedirect() {
  return <Navigate to="/funds/reports?tab=transactions" replace />;
}
