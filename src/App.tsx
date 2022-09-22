import React, { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilValue } from 'recoil'
import { viewLinksState } from './state'
import { ListItemButton, ListItemText, List } from '@mui/material'

export async function appLoader({ params }: any) {
  return null
}

export const App: React.FC = () => {
  const viewLinks = useRecoilValue(viewLinksState)
  const [selected, setSelected] = useState(0)

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 240px',
          gridTemplateRows: '100vh',
        }}
      >
        <List dense>
          {viewLinks.map((v, i) => {
            return (
              <ListItemButton
                key={v.name}
                component={Link}
                to={'/view/' + v.name}
                selected={selected === i}
                onClick={() => setSelected(i)}
              >
                <ListItemText primary={v.name} />
              </ListItemButton>
            )
          })}
        </List>
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
          <div>right panel</div>
        </Suspense>
      </div>
    </>
  )
}
