import UserProfile from '@/components/UserProfile'

export const metadata = {
  title: 'Home'
}

export default function Page() {
  return (
    <div style={{ padding: 24 }}>
      <h1>Home page!</h1>
      <div style={{ marginTop: 24 }}>
        <UserProfile />
      </div>
    </div>
  )
}
