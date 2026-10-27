"""Remove opaque backgrounds from user-supplied trophy images; preserve original in `user-originals`.
No synthetic trophies, only pixel-wise segmentation/matting of source images.
"""
from pathlib import Path
from PIL import Image, ImageFilter
import numpy as np, cv2, json, shutil
root=Path(__file__).resolve().parents[1]
folder=root/'assets/trophies/user'
backup=root/'assets/trophies/user-originals'
backup.mkdir(exist_ok=True)
report=[]

def grabcut_segment(a,rect,fgrect=None):
 h,w=a.shape[:2]
 m=np.zeros((h,w),np.uint8)
 x,y,rw,rh=rect
 m[y:y+rh,x:x+rw]=cv2.GC_PR_FGD
 if fgrect:
  xx,yy,ww,hh=fgrect
  m[yy:yy+hh,xx:xx+ww]=cv2.GC_FGD
 cv2.grabCut(a,m,None,np.zeros((1,65),np.float64),np.zeros((1,65),np.float64),7,cv2.GC_INIT_WITH_MASK)
 return (np.logical_or(m==cv2.GC_FGD,m==cv2.GC_PR_FGD).astype(np.uint8)*255)

def plain_seg(rgb,bg='white'):
 a=rgb.astype(np.float32)
 h,w=a.shape[:2]
 if bg=='black':
  m=(np.max(a,axis=2)<28).astype('uint8')
 else:
  m=(np.min(a,axis=2)>241).astype('uint8')
 # 8-connected component of background pixels seeded from boundary
 cc_n,cc=cv2.connectedComponents(m,connectivity=8)
 touches=np.unique(np.r_[cc[0,:],cc[-1,:],cc[:,0],cc[:,-1]])
 bgmask=np.isin(cc,touches) & (m==1)
 # contiguous background area with generous near-edge antialias
 # foreground inner highlights not connected to edge are retained
 alpha=np.where(bgmask,0,255).astype(np.uint8)
 # Fade 1-2px jagged edges to avoid harsh halo
 alpha=cv2.GaussianBlur(alpha,(3,3),0.48)
 return alpha

def checker_seg(rgb):
 a=rgb.astype(np.int16)
 # Checkerboard raster: white + 204/205 gray (neutral equal RGB)
 delta=a.max(2)-a.min(2)
 b=((delta<10)&(a.mean(2)>148))
 # almost all genuine art isn't exactly checker gray; remove wherever rasterized
 alpha=np.where(b,0,255).astype(np.uint8)
 # smooth tiny checker border against trophy silhouette
 alpha=cv2.medianBlur(alpha,3)
 return alpha

def belgium(rgb):
 h,w=rgb.shape[:2];a=rgb.astype(np.float32)
 # Remove white square + tan circular graphic behind the drawn trophy.
 light=(np.min(a,axis=2)>237)
 beige=((a[:,:,0]>195)&(a[:,:,1]>132)&(a[:,:,2]>115)&((a[:,:,0]-a[:,:,1])>14)&((a[:,:,1]-a[:,:,2])>5))
 mask=light|beige
 # Restrict removal of beige colors to the illustrated background disc away from cup
 # Keep central silver/gold trophy elements.
 H,W=np.ogrid[:h,:w]
 mask=light | (beige & ((((W-w*.50)/(w*.50))**2+((H-h*.52)/(h*.46))**2)<1.04))
 a=np.where(mask,0,255).astype(np.uint8)
 return cv2.medianBlur(a,3)

def circular_plate(rgb):
 h,w=rgb.shape[:2]
 yy,xx=np.mgrid[:h,:w]
 # silver plate photographed face-on; discard rectangular backdrop
 cx,cy=0.50*w,0.495*h
 rx,ry=0.420*w,0.491*h
 t=((xx-cx)/rx)**2+((yy-cy)/ry)**2
 return np.clip((1.011-t)*255/0.017,0,255).astype('uint8')

for f in sorted(folder.glob('*.png')):
 source=backup/f.name
 if not source.exists():shutil.copy2(f,source)
 im=Image.open(source).convert('RGBA')
 arr=np.asarray(im)
 rgb=arr[:,:,:3]
 name=f.name
 if name in ('liga-profesional-argentina.png',):
  alpha=arr[:,:,3].copy();method='preserved-existing-alpha'
 elif name in ('concacaf-champions-cup.png','ofc-champions-league.png'):
  alpha=checker_seg(rgb);method='checkerboard-removal'
 elif name=='j1-league.png':
  alpha=circular_plate(rgb);method='circular-plate-cutout'
 elif name=='copa-da-belgica.png':
  alpha=belgium(rgb);method='illustration-background-removed'
 elif name=='team-of-the-season.png':
  h,w=rgb.shape[:2]
  alpha=grabcut_segment(rgb,(int(w*.21),int(h*.16),int(w*.59),int(h*.75)),(int(w*.39),int(h*.32),int(w*.23),int(h*.48)))
  alpha=cv2.medianBlur(alpha,3);method='grabcut-foreground'
 elif name in ('afc-champions-league-elite.png','afc-champions-league-two.png','king-cup.png','kopa-trophy.png','us-open-cup.png'):
  alpha=plain_seg(rgb,'black');method='dark-backdrop-removal'
 else:
  alpha=plain_seg(rgb,'white');method='white-backdrop-removal'
 final=np.dstack((rgb,alpha))
 Image.fromarray(final,'RGBA').save(f,optimize=True)
 alpha_frac=float((alpha==0).sum())/alpha.size
 if np.all(alpha==255) and name!='liga-profesional-argentina.png':raise RuntimeError(f'no transparency: {name}')
 report.append({'file':name,'source_size':list(im.size),'processing':method,'transparent_fraction':round(alpha_frac,3),'corner_alpha':[int(alpha[y,x]) for y,x in ((0,0),(0,im.width-1),(im.height-1,0),(im.height-1,im.width-1))]})
(root/'tests/qa-alpha-matting.json').write_text(json.dumps(report,indent=2,ensure_ascii=False),'utf8')
print(json.dumps(report,indent=2,ensure_ascii=False))
