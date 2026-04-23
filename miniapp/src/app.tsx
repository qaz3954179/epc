import { PropsWithChildren } from 'react';
import { useAuthStore } from './store';
import './app.scss';

function App({ children }: PropsWithChildren) {
  // 启动时从本地存储恢复登录状态
  useAuthStore.getState().loadFromStorage();

  return <>{children}</>;
}

export default App;
