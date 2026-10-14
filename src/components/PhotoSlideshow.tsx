"use client";
import { useState, useEffect } from "react";

// 50 photos per time-of-day bucket — chosen by the user's local clock on mount
// Morning: 5am–11am | Afternoon: 11am–5pm | Evening: 5pm–9pm | Night: 9pm–5am

const MORNING = [
  "https://images.unsplash.com/photo-1500534623283-312aade485b7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519414442781-fbd745c5b497?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1536133949900-f5a694c62836?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1665849863678-fc03a642a9aa?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1622993288089-18298ec89b78?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1757269267274-085b02b0ce8a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1466854076813-4aa9ac0fc347?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1489493512598-d08130f49bea?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1444090542259-0af8fa96557e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1612676239016-41e2c92b8e06?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1458093257227-0f30303eb1f0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1551815943-385d5246c8a1?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1486707471592-8e7eb7e36f78?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1502689444867-e9d77b2d4758?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1632307941173-5d541ea1d940?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1736649236088-9e5abca1c08d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1696340082877-e1a0d31025a8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476362555312-ab9e108a0b7e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1444837881208-4d46d5c1f127?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1525891618908-24765267dab7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1541480110211-586977e40589?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1603794052293-650dbdeef72c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1696279976107-4d80eb0a7d82?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1446491429004-809880bd132e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1696875975802-ccd3d81077c4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1491982883790-ead7c97a047e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1659033860352-40fe8d2b7005?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1768385592675-d275a701cbf9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1790601545893-30ecfd20b12b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1790243848460-4d2e86faf159?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476297816471-97713c4d237c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1418874525809-bec95b9c4500?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1684597619632-471f18b09d12?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1483446169163-1bc8ee2d7b1f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1677759716885-cbf4e706bcbe?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1786227192576-95cd285a4dc4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1768225601822-e6077c0cb086?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1781032480530-5809498d868b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1790583094204-0bbe38542073?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1789648691189-1a35ac3e5dff?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476610182048-b716b8518aae?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1783824521270-1f7a27fde9a0?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1536650918817-78577798d82c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1621847468516-1ed5d0df56fe?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1784034925516-fdd864ebec6a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1621959721891-d297dfd9d6ee?auto=format&fit=crop&w=1920&q=80",
];

const AFTERNOON = [
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482192505345-5655af888cc4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1433086966358-54859d0ed716?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?auto=format&fit=crop&w=1920&q=80",
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
  "https://images.unsplash.com/photo-1788072723551-03452239b562?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1611657291636-c141ee8cf7ab?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1787594799825-3586cee8243e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1786875209914-2c33b4006a7d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1611307742746-43cbea512c37?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1526239187794-f8c27c7872ee?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1617194369222-af8a7e682365?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1500622944204-b135684e99fd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1621846846625-f0bde2eb7c3c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1516687401797-25297ff1462c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1483921020237-2ff51e8e4b22?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1477468572316-36979010099d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519931760384-a96fedd8dfa9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1512273222628-4daea6e55abb?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1465220183275-1faa863377e3?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476108621677-3c620901b5e7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1507281736509-c6289f1ea0f8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1589405858862-2ac9cbb41321?auto=format&fit=crop&w=1920&q=80",
];

const EVENING = [
  "https://images.unsplash.com/photo-1542159919831-40fb0656b45a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1510784722466-f2aa9c52fff6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1586791965591-15d8892f6dd6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1681471887316-57f295d5e0a9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1567234495729-2015d9058e45?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1498575637358-821023f27355?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1649006775680-e642cabdf0df?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1515966097209-ec48f3216288?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1560455484-bd8b34ebdec4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1692713471734-38aa1ffc899e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1738407272175-6a01c55047c9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1646503474538-2b74022fe22b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506361397175-641e79c74c23?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519111275132-f37bc7867081?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1437773540554-96d393b4d0c9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1490682143684-14369e18dce8?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1536257104079-aa99c6460a5a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1629482472125-a8a8faae4dd6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1659608300525-a71e30dd2420?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506880648420-aafaa650d147?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1585215148712-c6505c99c392?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1523436495875-154b5f8317e1?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1553117595-56534f5d7492?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1595495745485-f5ffc0318e7f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1560468080-caec9cb4853f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1557671470-53bd93e7bdf3?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1773171135490-ff92b906a3de?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1785965964268-4732834eefac?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1781177253612-ffeadab11662?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1722906777312-2bc56e4cbf82?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1770917278902-670ac92efb1d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1784987608397-288b50845cf1?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1767257837102-9f9638655864?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1771038359679-1e08add2e235?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1789586971798-b2a21c490c06?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1773629226132-f8ef0da28a64?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1784034581483-10cb1e48c33a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1782595685856-1404787e6a7d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1791201903802-eb7666273d2d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1682687218147-9806132dc697?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1620841374140-2d0e37f9872b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1695842585219-c59d73519571?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1619266465172-02a857c3556d?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1636144023232-a321eb581070?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1704739410998-564ae85cc537?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1786029492041-29db4fe6f845?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1643727230494-84671df76705?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1784560273013-7c18e962bd85?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1773569576077-f76da1c580cd?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1762694777885-1349f9a31700?auto=format&fit=crop&w=1920&q=80",
];

const NIGHT = [
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1509773896068-7fd415d91e2e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1506105524407-94b39b1e7415?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1628847970849-5473cfd0dcc2?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1485846621887-33cf97dc4c8e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1594745025719-a419ca3852c9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1498611291069-aa296192f1e4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1482406611936-43ea538e39d4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1709804889528-66d4e8f269f4?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1592636120953-3d2b28ebfd69?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1635918796879-c55f5cc94458?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1618473962497-68e8d4e0680e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1519681894595-7fc78e06f2d7?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1599168957000-7c1597f5e774?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1513165533842-2a0dd8b51a74?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1631883496924-bb1eefb1e69e?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1604608672516-f1b9b1d37076?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1610989432929-9769f3cf8006?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1715505535741-e20f2ea6c573?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1498946550856-a8c16e64cb4c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1526644253653-a411eaafdfe6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1513786704796-b35842f0dca6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1612686635542-2244ed9f8ddc?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1637055972140-64608c1abe53?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1593291600904-660bbd59a758?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1476970980147-71209edbfa4f?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1682547095937-6765f750e429?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1614090691187-983c32a930c9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1549633759-5e6e8b0ed2ab?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1639162147585-60019ada4361?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1709238810760-bae86f4c2204?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1758466426195-4c9e2ef10a53?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1764088055770-364e1f52c651?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1773101189153-636666d8ba8b?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1539667468225-eebb663053e6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1639162147469-a02dee15e1d9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1511719218143-933ef7b27efa?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1642510029181-b881117a7dc9?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1712341423802-9a89aa6a8fe6?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1785735966643-0dd97e26c831?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1761030305574-6d400baff46a?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1776890880055-efd818511b63?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1708577680120-dbbf24abcc70?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1779063362188-ba33291f8156?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1595520519880-a86c48ea536c?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1606230144598-ed5d503a4c43?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1566052356702-c255c7af3521?auto=format&fit=crop&w=1920&q=80",
  "https://images.unsplash.com/photo-1639980473038-82cf8e1ea142?auto=format&fit=crop&w=1920&q=80",
];

const BUCKETS = { morning: MORNING, afternoon: AFTERNOON, evening: EVENING, night: NIGHT } as const;
type Bucket = keyof typeof BUCKETS;

function getTimeBucket(): Bucket {
  const h = new Date().getHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 21) return "evening";
  return "night";
}

interface Props {
  interval?: number;
  transitionMs?: number;
}

export default function PhotoSlideshow({ interval = 7000, transitionMs = 2500 }: Props) {
  const [photos] = useState<string[]>(() => BUCKETS[getTimeBucket()]);
  const [idx, setIdx] = useState(0);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setFading(true);
      const swap = window.setTimeout(() => {
        setIdx(i => (i + 1) % photos.length);
        setFading(false);
      }, transitionMs);
      return () => clearTimeout(swap);
    }, interval);
    return () => clearInterval(t);
  }, [interval, transitionMs, photos]);

  const nextIdx = (idx + 1) % photos.length;

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${photos[idx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div
        style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${photos[nextIdx]})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: fading ? 1 : 0,
          transition: fading ? `opacity ${transitionMs}ms ease-in-out` : "none",
        }}
      />
    </div>
  );
}
