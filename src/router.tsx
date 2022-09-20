import { App, appLoader } from './App'
import { TablePage, tablePageLoader } from './TablePage'
import { createBrowserRouter } from 'react-router-dom'

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

export default router
