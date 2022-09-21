import React, { Suspense } from 'react'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { viewLinksState } from './state'
import Button from '@mui/material/Button'

export async function appLoader({ params }: any) {
  return null
}

export const App: React.FC = () => {
  const viewLinks = useRecoilValue(viewLinksState)

  return (
    <>
      <div style={{ display: 'flex', width: '100%' }}>
        <div>
          {viewLinks.map((v) => {
            return (
              <div key={v.name}>
                <Button
                  component={Link}
                  variant="contained"
                  to={'/view/' + v.name}
                >
                  {v.name}
                </Button>
              </div>
            )
          })}
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
