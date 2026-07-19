export interface CanvasImage {
  id: string;
  url: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  borderType: string;
  borderWidth: number;
  borderColor: string;
  zIndex: number;
}

export interface Spread {
  id: number | string;
  leftImage: string;
  rightImage: string;
  leftPageType?: 'single' | 'canvas';
  rightPageType?: 'single' | 'canvas';
  leftCanvasImages?: CanvasImage[];
  rightCanvasImages?: CanvasImage[];
}

export interface Album {
  id: string;
  title: string;
  template: string;
  audio_url: string;
  audio_name?: string;
  cover_url: string;
  back_cover_url?: string;
  inner_front_url?: string;
  inner_back_url?: string;
  combined_inner_url?: string;
  is_combined_inner?: boolean;
  orientation: string;
  page_marking: string;
  spreads: Spread[];
  client_name?: string;
  function_name?: string;
  function_date?: string;
  view_lock_pin?: string;
  is_public?: boolean;
  created_at?: string;
  status?: string;
  job_number?: string;
  studio_name?: string;
  photographer_name?: string;
  mobile_number?: string;
}
