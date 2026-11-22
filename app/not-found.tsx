import { redirect } from 'next/navigation'

export default function NotFound() {
  // Redirect invalid routes to default asset (BTC)
  redirect('/perpetual/crypto-btcusd')
}