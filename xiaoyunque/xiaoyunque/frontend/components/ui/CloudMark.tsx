import type { SVGProps } from 'react';
import { CLOUD_MARK_PATH } from '@/config/brand';

export default function CloudMark(props: SVGProps<SVGSVGElement>) {
  return <svg viewBox="0 0 64 52" fill="currentColor" aria-hidden="true" {...props}><path fillRule="evenodd" clipRule="evenodd" d={CLOUD_MARK_PATH} /></svg>;
}
