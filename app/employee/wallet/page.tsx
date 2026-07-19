import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";
import { getWalletAction } from "@/app/actions/wallet";
import { AddMoneyButton } from "./AddMoneyButton";
import { WithdrawButton } from "./WithdrawButton";
import { redirect } from "next/navigation";

export default async function WalletPage() {
  const { success, wallet, monthlyEarnings } = await getWalletAction();

  if (!success || !wallet) {
    return redirect("/auth/signin");
  }

  const transactions = wallet.transactions || [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <BackButton title="Back to Dashboard" />
      <h2 className="text-2xl font-bold mb-6">Wallet & Earnings</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-600 to-blue-800 text-white border-0 shadow-lg">
          <CardHeader className="pb-2">
            <CardTitle className="text-blue-100 font-medium">Available Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">₹{wallet.balance.toFixed(2)}</div>
            <div className="mt-4 flex space-x-3">
              <AddMoneyButton />
              <WithdrawButton maxAmount={wallet.balance} />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-500 font-medium text-sm">Total Earnings (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">₹{monthlyEarnings?.toFixed(2) || "0.00"}</div>
            <p className="text-sm text-green-500 mt-2 font-medium">From completed rides</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
      {transactions.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">
          No transactions yet. Add money to get started!
        </Card>
      ) : (
        <div className="space-y-3">
          {transactions.map((tx: any) => (
            <div key={tx.id} className="flex justify-between items-center p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
              <div>
                <p className="font-medium">{tx.description}</p>
                <p className="text-sm text-gray-500">{new Date(tx.createdAt).toLocaleDateString()}</p>
              </div>
              <div className={`font-bold ${tx.type === "DEBIT" ? "text-gray-700 dark:text-gray-300" : "text-green-600"}`}>
                {tx.type === "DEBIT" ? "-" : "+"}₹{tx.amount.toFixed(2)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
