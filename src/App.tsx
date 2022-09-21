import React, { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { viewLinksState } from './state'

export async function appLoader({ params }: any) {
  return null
}

export const App: React.FC = () => {
  const viewLinks = useRecoilValue(viewLinksState)

  return (
    <>
      <div style={{ display: 'flex', width: '100%' }}>
        <div>
          <ul>
            {viewLinks.map((v) => {
              return (
                <li key={v.name}>
                  <Link to={'view/' + v.name}>{v.name}</Link>
                </li>
              )
            })}
          </ul>
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <div style={{ width: '800px' }}>
            <Outlet />
          </div>
        </Suspense>
      </div>
    </>
  )
}
