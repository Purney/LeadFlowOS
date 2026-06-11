import { redirect } from "next/navigation";
import { CreditCard, FileWarning, Receipt, TrendingUp } from "lucide-react";
import { auth } from "@/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getRevenueMetrics,
  listStripeInvoices,
} from "@/services/revenue-service";

function money(amount: number, currency = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

export default async function RevenuePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const [metrics, invoices] = await Promise.all([
    getRevenueMetrics(session.user.organisationId),
    listStripeInvoices(session.user.organisationId),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Stripe customers, invoices, payments, and revenue metrics from
          verified webhook events.
        </p>
      </div>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Monthly revenue</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{money(metrics.monthlyRevenue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Lifetime value</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{money(metrics.lifetimeValue)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Paid invoices</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <Receipt className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.paidCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-muted-foreground">Unpaid invoices</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-3">
            <FileWarning className="h-5 w-5 text-muted-foreground" />
            <p className="text-2xl font-semibold">{metrics.unpaidCount}</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Revenue trend</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.revenueTrend.length > 0 ? (
              <div className="space-y-3">
                {metrics.revenueTrend.map((point) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                    key={point.month}
                  >
                    <span>{point.month}</span>
                    <span className="font-medium">{money(point.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Paid Stripe invoices will appear here.
              </p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Revenue by customer</CardTitle>
          </CardHeader>
          <CardContent>
            {metrics.revenueByCustomer.length > 0 ? (
              <div className="space-y-3">
                {metrics.revenueByCustomer.map((item) => (
                  <div
                    className="flex items-center justify-between rounded-md border border-border p-3 text-sm"
                    key={item.customer}
                  >
                    <span>{item.customer}</span>
                    <span className="font-medium">{money(item.amount)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                Customer revenue appears after invoice payments.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Invoices</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border border-border">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Invoice</th>
                  <th className="px-4 py-3 font-medium">Customer</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Due</th>
                  <th className="px-4 py-3 font-medium">Paid</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {invoices.length > 0 ? (
                  invoices.map((invoice) => (
                    <tr key={invoice._id.toString()}>
                      <td className="px-4 py-3">{invoice.number ?? invoice.stripeInvoiceId}</td>
                      <td className="px-4 py-3">{invoice.stripeCustomerId ?? "Unknown"}</td>
                      <td className="px-4 py-3">{invoice.status}</td>
                      <td className="px-4 py-3">{money(invoice.amountDue, invoice.currency)}</td>
                      <td className="px-4 py-3">{money(invoice.amountPaid, invoice.currency)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td className="px-4 py-8 text-center text-muted-foreground" colSpan={5}>
                      No Stripe invoices recorded yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
