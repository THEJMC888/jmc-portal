"use client";
import { useState, useEffect } from "react";

const PHOTOS = [
  // Verified keepers — confirmed pure nature
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1768409234914-96f61529b7e2?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1604223190546-a43e4c7f29d7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1601281426795-9fedf41df8d1?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1509316785289-025f5b846b35?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1610552050890-fe99536c2615?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1426604966848-d7adac402bff?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1516825994218-b2d93290b0fd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1534088568595-a066f410bcda?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1760301269447-fbc82b5a8d14?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1612441804231-77a36b284856?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1787035957656-4fdf60760685?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1532274402911-5a369e4c4bb5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476673160081-cf065607f449?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1611080402167-ed75bae6df32?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1444927714506-8492d94b4e3d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1552152370-fb05b25ff17d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1498429089284-41f8cf3ffd39?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1612539473441-dfc1cefd5e1e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482685945432-29a7abf2f466?auto=format&fit=crop&w=1920&q=80",
  // Fresh mountain & nature landscapes (scraped from Unsplash live search)
  "https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1784034925516-fdd864ebec6a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1788072723551-03452239b562?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1611657291636-c141ee8cf7ab?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1787594799825-3586cee8243e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1786875209914-2c33b4006a7d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1611307742746-43cbea512c37?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1526239187794-f8c27c7872ee?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1617194369222-af8a7e682365?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1500622944204-b135684e99fd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1621846846625-f0bde2eb7c3c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1759590339000-6978a0cdf2fb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1516687401797-25297ff1462c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1477468572316-36979010099d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519931760384-a96fedd8dfa9?auto=format&fit=crop&w=1920&q=80",
  // Fresh alpine & snow
  "https://images.unsplash.com/photo-1512273222628-4daea6e55abb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465220183275-1faa863377e3?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476108621677-3c620901b5e7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1418985991508-e47386d96a71?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1615028427098-f2185474eeb3?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1507281736509-c6289f1ea0f8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1621879602959-2c2b24c7cacc?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1523720131524-71ae6dbed986?auto=format&fit=crop&w=1920&q=80",
  // Fresh waterfalls
  "https://images.unsplash.com/photo-1783824521270-1f7a27fde9a0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1536650918817-78577798d82c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1597099911706-1f7c9ba6839b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1608462884409-20ad7c86b55f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1705956659508-b3a899873d13?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1568323003715-8c0254336dfa?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1621959721891-d297dfd9d6ee?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1656288227038-28aaa4f6b8ad?auto=format&fit=crop&w=1920&q=80",
  // Fresh ocean & coastal
  "https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1619233651146-7364c945c3ee?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1510439107456-aa9d56f2013e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1565706444617-09c267f302c6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1456753510773-a8bd200a4a26?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470217407524-b1e77afc6ec5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1461730278450-19cc1863601c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1446038202205-1c96430dbdab?auto=format&fit=crop&w=1920&q=80",
  // Otherworldly & alien natural landscapes
  "https://images.unsplash.com/photo-1682687218147-9806132dc697?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1508556497405-ed7dcd94acfc?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1758461479768-bdbce375e005?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1762694777885-1349f9a31700?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1773569576077-f76da1c580cd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1784560273013-7c18e962bd85?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1528224221541-40babe5bb315?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1620841374140-2d0e37f9872b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1520715871346-413af35664f0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1695842585219-c59d73519571?auto=format&fit=crop&w=1920&q=80",
  // Volcanic & dramatic earth
  "https://images.unsplash.com/photo-1619266465172-02a857c3556d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1636144023232-a321eb581070?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1644182321484-7c94f1224b24?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1715348020419-4667c7b01b2c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1759710900747-c2f17cdb1707?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1643727230494-84671df76705?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1704739410998-564ae85cc537?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1786029492041-29db4fe6f845?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1760311174612-4cc057f93e2c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1575580280904-905f466584e0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1589405858862-2ac9cbb41321?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1514496959998-c01c40915c5f?auto=format&fit=crop&w=1920&q=80",
];

interface Props {
  interval?: number;
  transitionMs?: number;
}

export default function PhotoSlideshow({ interval = 7000, transitionMs = 2500 }: Props) {
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      const swap = window.setTimeout(() => {
        setIdx(i => (i + 1) % PHOTOS.length);
        setFading(false);
      }, transitionMs);
      return () => clearTimeout(swap);
    }, interval);
    return () => clearInterval(t);
  }, [interval, transitionMs]);

  const nextIdx = (idx + 1) % PHOTOS.length;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      {/* Base layer — current photo */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${PHOTOS[idx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      {/* Top layer — next photo fades in */}
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${PHOTOS[nextIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 1 : 0,
          transition: fading ? `opacity ${transitionMs}ms ease-in-out` : "none",
        }}
      />
    </div>
  );
}
