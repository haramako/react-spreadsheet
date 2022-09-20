import React, { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilState } from 'recoil'
import { viewLinksState } from './state'

export async function appLoader({ params }: any) {
  return null
}

export const App: React.FC = () => {
  const [viewLinks] = useRecoilState(viewLinksState)

  return (
    <>
      <div>
        {viewLinks.map((v) => {
          return (
            <span key={v.name}>
              <Link to={'view/' + v.name}>{v.name}</Link> |
            </span>
          )
        })}
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <Outlet />
      </Suspense>
    </>
  )
}
