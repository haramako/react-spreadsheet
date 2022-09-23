import React, { Suspense, useState } from 'react'
import { Outlet } from 'react-router'
import { Link } from 'react-router-dom'
import { useRecoilState, useRecoilValue } from 'recoil'
import { dataPathState, datasetState, viewLinksState } from './state'
import {
  ListItemButton,
  ListItemText,
  List,
  ButtonGroup,
  Button,
  Input,
} from '@mui/material'
import { saveDataset } from './dataset'
import { DataView } from './DataView'

export async function appLoader({ params }: any) {
  return null
}

export const App: React.FC = () => {
  const viewLinks = useRecoilValue(viewLinksState)
  const dataset = useRecoilValue(datasetState)
  const [dataPath, setDataPath] = useRecoilState(dataPathState)
  const [path, setPath] = useState(dataPath)
  const [selected, setSelected] = useState(0)

  function onSaveClick() {
    const json = JSON.stringify(saveDataset(dataset), undefined, '\t')
    fetch('/api/files/' + path, { method: 'PUT', body: json })
      .then((res) => res.text())
      .then((body) => {
        console.log(body)
      })
      .catch((err) => console.log(err))
  }

  function onLoadClick() {
    setDataPath(path)
  }

  return (
    <>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '200px 1fr 240px',
          gridTemplateRows: '100vh',
        }}
      >
        <div>
          <Input value={path} onChange={(e) => setPath(e.target.value)} />
          <ButtonGroup size="small" variant="contained">
            <Button onClick={onSaveClick}>保存</Button>
            <Button onClick={onLoadClick}>読み込み</Button>
          </ButtonGroup>
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
        </div>
        <Suspense fallback={<div>Loading...</div>}>
          <Outlet />
          <DataView />
        </Suspense>
      </div>
    </>
  )
}
