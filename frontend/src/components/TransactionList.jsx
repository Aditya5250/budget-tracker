import TransactionItem from "./TransactionItem";

export default function TransactionList({ transactions, onDelete }) {
  if (!transactions.length) {
    return (
      <p className="empty-state">
        💸 No transactions yet<br />
        Start tracking your money today 👇
      </p>
    );
  }

  return (
    <div className="tx-list">
      {transactions.map((tx) => (
        <TransactionItem
          key={tx.id}
          tx={tx}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}