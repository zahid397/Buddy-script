'use client';

import type { ReactNode } from 'react';
import { Moon, Sun } from 'lucide-react';
import Header from './Header';
import LeftSidebar from './LeftSidebar';
import RightSidebar from './RightSidebar';
import { useDemoSimulator } from '@/hooks/useDemoSimulator';
import { useTheme } from '@/hooks/useTheme';

export default function AppShell({ children }: { children: ReactNode }) {
  useDemoSimulator();
  const { dark, compact, setDark } = useTheme();

  return (
    <div className={`_layout _layout_main_wrapper${dark ? ' _dark_wrapper' : ''}${compact ? ' _compact_density' : ''}`}>
      <div className="_layout_mode_swithing_btn">
        <button
          type="button"
          className="_layout_swithing_btn_link"
          onClick={() => setDark(!dark)}
          aria-label="Toggle dark mode"
        >
          <div className="_layout_swithing_btn">
            <div className="_layout_swithing_btn_round" />
          </div>
          <div className="_layout_change_btn_ic1">
            <Moon size={13} color="#fff" />
          </div>
          <div className="_layout_change_btn_ic2">
            <Sun size={18} color="#fff" />
          </div>
        </button>
      </div>
      <div className="_main_layout">
        <Header />
        <div className="container _custom_container">
          <div className="_layout_inner_wrap">
            <div className="row">
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <LeftSidebar />
              </div>
              <div className="col-xl-6 col-lg-6 col-md-12 col-sm-12">
                <div className="_layout_middle_wrap">
                  <div className="_layout_middle_inner">{children}</div>
                </div>
              </div>
              <div className="col-xl-3 col-lg-3 col-md-12 col-sm-12">
                <RightSidebar />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
