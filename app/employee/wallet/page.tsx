import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BackButton } from "@/components/ui/BackButton";

export default function WalletPage() {
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
            <div className="text-4xl font-bold">$124.50</div>
            <div className="mt-4 flex space-x-3">
              <Button variant="secondary" size="sm" className="bg-white text-blue-700 hover:bg-gray-100">Add Money</Button>
              <Button variant="outline" size="sm" className="text-white border-white hover:bg-white/20">Withdraw</Button>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-gray-500 font-medium text-sm">Total Earnings (This Month)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-800 dark:text-white">$345.00</div>
            <p className="text-sm text-green-500 mt-2 font-medium">+15% from last month</p>
            <p className="text-xs text-gray-500 mt-1">From offering 12 rides</p>
          </CardContent>
        </Card>
      </div>

      <h3 className="text-lg font-semibold mb-3">Recent Transactions</h3>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex justify-between items-center p-4 border rounded-md bg-white dark:bg-gray-800 dark:border-gray-700 shadow-sm">
            <div>
              <p className="font-medium">{i === 2 ? "Ride Payment" : "Earnings from Ride"}</p>
              <p className="text-sm text-gray-500">Oct 1{i}, 2026</p>
            </div>
            <div className={`font-bold ${i === 2 ? "text-gray-700 dark:text-gray-300" : "text-green-600"}`}>
              {i === 2 ? "-" : "+"}${i * 5}.00
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
