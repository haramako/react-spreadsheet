import ReactDOM from 'react-dom/client'
import './index.css'
import reportWebVitals from './reportWebVitals'
import { App, appLoader } from './App'
import { TablePage, tablePageLoader } from './TablePage'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import {
  RecoilRoot,
  atom,
  selector,
  useRecoilState,
  useRecoilValue,
} from 'recoil'
import { Dataset } from './dataset'

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    loader: appLoader,
    children: [
      {
        path: '/view/:view',
        element: <TablePage />,
        loader: tablePageLoader,
      },
    ],
  },
])

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)
/*
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
*/
root.render(
  <RecoilRoot>
    <RouterProvider router={router} />
  </RecoilRoot>,
)

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals()
