import React from 'react';
import { Header } from './Header';

interface TopbarProps {
  title: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * @deprecated Use `Header` from './Header' instead. This shim is kept so existing
 * pages keep working during the gradual migration to the new global header.
 */
export const Topbar: React.FC<TopbarProps> = (props) => <Header {...props} />;
