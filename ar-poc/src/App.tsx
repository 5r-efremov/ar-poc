import { Scanner } from './components/Scanner';
import schemeConfig from './config/schemes.json';
import type { SchemeConfig } from './data/SchemeTypes';

export default function App() {
  return <Scanner config={schemeConfig as SchemeConfig} />;
}
