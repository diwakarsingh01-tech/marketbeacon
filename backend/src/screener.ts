import YahooFinance from 'yahoo-finance2';
import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { fileURLToPath } from 'url';
import { NIFTY_500 } from './universe.js';
import { calculateEnvelope, processShortEnvelope, calculateBollingerBand, calculateSMAStacking, calculate52WeekStrategy, calculateCupHandle, calculateSRStrategy, calculateSixtySevenFunda, calculateTwentyRallyRetest, checkInstitutionalMandates } from './strategies/index.js';
import { supabase } from './db.js';

// BROAD_UNIVERSE: Nifty 500 + ~1500 additional mid/small-cap symbols for wider market scanning.
export const BROAD_UNIVERSE = Array.from(new Set([
  ...NIFTY_500,
  "AFFLE.NS", "AHLUCONT.NS", "AHL.NS", "ALMONDZ.NS", "ALPA.NS", "AMBER.NS", "AMIORG.NS", "ANAMAT.NS", "ANANDRATHI.NS", "ANGELONE.NS", "ANSALAPI.NS", "ANUP.NS", "APEX.NS", "APTEUS.NS", "ARCHIDPLY.NS", "ARIES.NS", "ARVIND.NS", "ARVSMART.NS", "ASAHIINDIA.NS", "ASALCBR.NS", "ASHAPURMIN.NS", "ASIANHOTNR.NS", "ASMS.NS", "AURIONPRO.NS", "AUTOLITIND.NS", "AVALON.NS", "AXITA.NS", "B&B.NS", "BAGFILMS.NS", "BAJAJHOLD.NS", "BALAXI.NS", "BALLARPUR.NS", "BANKNIFTY1.NS", "BCG.NS", "BCLIND.NS", "BECTORFOOD.NS", "BEDMUTHA.NS", "BEPL.NS", "BFUTILITIE.NS", "BGRENERGY.NS", "BHAGERIA.NS", "BHALCHANDR.NS", "BHANDARI.NS", "BHARATWIRE.NS", "BIL.NS", "BINANIIND.NS", "BLBLIMITED.NS", "BLKASHYAP.NS", "BLS.NS", "BLUEJET.NS", "BODALCHEM.NS", "BOROLTD.NS", "BOROSCI.NS", "BPL.NS", "BRNL.NS", "BURGERKING.NS", "CALSOFT.NS", "CAMPUS.NS", "CANOPY.NS", "CAPACITE.NS", "CARTRADE.NS", "CARYSIL.NS", "CENTENKA.NS", "CENTERAC.NS", "CENTUM.NS", "CFEL.NS", "CIGNITI.NS", "CITYUNION.NS", "CLEDUCATE.NS", "CLNINDIA.NS", "CMICABLES.NS", "COMPUSOFT.NS", "CONSOFINVT.NS", "CONTI.NS", "CONTROLPR.NS", "COSMOFIRST.NS", "COUNTRYCOD.NS", "CPS.NS", "CRAFTSMAN.NS", "CREATIVE.NS", "CREATIVEYE.NS", "CREST.NS", "CROWN.NS", "CSBBANK.NS", "CUPID.NS", "CYBERTECH.NS", "DALBHARAT.NS", "DALMIASUG.NS", "DANLAW.NS", "DATAMATICS.NS", "DBREALTY.NS", "DBSTOCKBRO.NS", "DCM.NS", "DCMNSE.NS", "DCW.NS", "DECCANCE.NS", "DEEPIND.NS", "DELPHIFX.NS", "DEN.NS", "DEVIT.NS", "DFMFOODS.NS", "DHAMPURSUG.NS", "DHANBANK.NS", "DHANI.NS", "DHANUKA.NS", "DHARAMSI.NS", "DHRUV.NS", "DHUNINV.NS", "DIGIDRIVE.NS", "DIGISPICE.NS", "DIGJAMLMTD.NS", "DIL.NS", "DKEGL.NS", "DOLATALGO.NS", "DOLLAR.NS", "DONEAR.NS", "DPABHUSHAN.NS", "DPSCLTD.NS", "DQE.NS", "DREDGECORP.NS", "DRHABEEB.NS", "DSML.NS", "DSSL.NS", "DUCON.NS", "DVL.NS", "DYCL.NS", "DYNAMATECH.NS", "E2E.NS", "EASTSILK.NS", "EASUNREYRL.NS", "EBBETF0425.NS", "EBBETF0430.NS", "EIMCOELECO.NS", "EKC.NS", "ELECON.NS", "ELECTCAST.NS", "ELECTHERM.NS", "ELGIRUBCO.NS", "EMAMIPAP.NS", "EMBASSY.NS", "EMKAY.NS", "EMKAYTOOLS.NS", "ENERGYDEV.NS", "ENIL.NS", "EPIGRAL.NS", "ERFLNCDI.NS", "ESABINDIA.NS", "ESSARSHPNG.NS", "ESTER.NS", "EUROTEXIND.NS", "EVEREADY.NS", "EVERESTIND.NS", "EXCEL.NS", "EXCELINDUS.NS", "EXXARO.NS", "FELIX.NS", "FIBERWEB.NS", "FIDEL.NS", "FIEMIND.NS", "FILATEX.NS", "FIVESTAR.NS", "FLAIR.NS", "FLEXITUFF.NS", "FMNL.NS", "FOCUS.NS", "FOODSIN.NS", "FORCEMOT.NS", "FORMOST.NS", "FOSECOIND.NS", "FOURTHDIM.NS", "FSC.NS", "GABRIEL.NS", "GAEL.NS", "GALACTICO.NS", "GANDHITUBE.NS", "GANECOS.NS", "GANESHBE.NS", "GANGAFORGE.NS", "GANGESSECU.NS", "GARFIBRES.NS", "GATECH.NS", "GATEWAY.NS", "GATI.NS", "GAYAHWS.NS", "GEECEE.NS", "GEEKAYWIRE.NS", "GENCON.NS", "GENESYS.NS", "GENUSPOWER.NS", "GEOJITFSL.NS", "GILLETTE.NS", "GINNIFILA.NS", "GIPCL.NS", "GISOLUTION.NS", "GKWLIMITED.NS", "GLAND.NS", "GLOBAL.NS", "GLOBALVECT.NS", "GLOBE.NS", "GLOBUSSPR.NS", "GMBREW.NS", "GMMPFAUDLR.NS", "GNA.NS", "GODHA.NS", "GOENKA.NS", "GOKEX.NS", "GOLDBEES.NS", "GOLDENTOBC.NS", "GOLDIAM.NS", "GOLDSTAR.NS", "GOLDTECH.NS", "GOODLUCK.NS", "GOODYEAR.NS", "GPIL.NS", "GRAVITA.NS", "GREENLAM.NS", "GREENPANEL.NS", "GREENPLY.NS", "GREENCHEM.NS", "GREP.NS", "GRINFRA.NS", "GRPLTD.NS", "GSLSU.NS", "GSS.NS", "GTECJAIN.NS", "GTL.NS", "GTLINFRA.NS", "GTPL.NS", "GUJAPOLLO.NS", "GULFPETRO.NS", "GULPOLY.NS", "GVKPIL.NS", "HARRMALAYA.NS", "HARSHA.NS", "HASAB.NS", "HAVISHA.NS", "HBL.NS", "HCL-INSYS.NS", "HCP.NS", "HEALTHY.NS", "HESTERBIO.NS", "HEXATRADEX.NS", "HGINFRA.NS", "HGS.NS", "HIGHGROUND.NS", "HIL.NS", "HILTON.NS", "HINDCOMPOS.NS", "HINDMOTORS.NS", "HINDNATGLS.NS", "HINDONGGEL.NS", "HINDSPIN.NS", "HINDSYNTEX.NS", "HINDUJAVEN.NS", "HITECH.NS", "HITECHCORP.NS", "HITECHGEAR.NS", "HLEGLAS.NS", "HLVLTD.NS", "HMT.NS", "HMVL.NS", "HNDFDS.NS", "HOMEFIRST.NS", "HONDAPOWER.NS", "HOVS.NS", "HPAL.NS", "HPL.NS", "HSIL.NS", "HTMEDIA.NS", "HUBTOWN.NS", "HUHTAMAKI.NS", "HYBRIDFIN.NS", "ICEMAKE.NS", "ICICIB22.NS", "IDEA.NS", "IDFNIFTYET.NS", "IFBAGRO.NS", "IFGLEXPOR.NS", "IGARASHI.NS", "IGPL.NS", "IIFL.NS", "IIFLCAP.NS", "IIFLFINANCE.NS", "IIFLSEC.NS", "IIHFL.NS", "IITL.NS", "IKIO.NS", "IL&FSENGG.NS", "IL&FSTRANS.NS", "IMAGICAA.NS", "IMFA.NS", "IMPAL.NS", "IMPEXFERRO.NS", "INCREDIBLE.NS", "INDBANK.NS", "INDIAGLYCO.NS", "INDIAMART.NS", "INDIANCARD.NS", "INDIANHUME.NS", "INDIGOPNTS.NS", "INDIGRID.NS", "INDNIPPON.NS", "INDOAMIN.NS", "INDOBORAX.NS", "INDOFARM.NS", "INDOGLOBAL.NS", "INDOTECH.NS", "INDOTHAI.NS", "INDOWIND.NS", "INDRAMEDCO.NS", "INDSWFTLAB.NS", "INDSWFTLTD.NS", "INDTERRAIN.NS", "INDUSTOWER.NS", "INFOBEANS.NS", "INFOMEDIA.NS", "INGERRAND.NS", "INNOVANA.NS", "INNOVATIVE.NS", "INOXGREEN.NS", "INSECTICID.NS", "INSPIRISYS.NS", "INTEGRA.NS", "INTENTECH.NS", "INTLCONV.NS", "INVENTURE.NS", "IOLCP.NS", "IPL.NS", "IRIS.NS", "IRISDOREME.NS", "ISFT.NS", "ISGEC.NS", "ISMTLTD.NS", "IVC.NS", "IVP.NS", "IZMO.NS", "JAIBALAJI.NS", "JAINSTUDIO.NS", "JAL.NS", "JASH.NS", "JAYAGROGN.NS", "JAYBARMARU.NS", "JAYNECOIND.NS", "JAYSREETEA.NS", "JBFIND.NS", "JBMA.NS", "JHS.NS", "JINDRILL.NS", "JINDWORLD.NS", "JISLDVREQS.NS", "JMT.NS", "JOCIL.NS", "JPIN.NS", "JPOLYINVST.NS", "JPPOWER.NS", "JSLHISAR.NS", "JTEKTINDIA.NS", "JTLINFRA.NS", "JUBLINDS.NS", "JUBLINGREA.NS", "JUBLPHARMA.NS", "JUNIORBEES.NS", "JYOTISTRUC.NS", "KABRAEXTRU.NS", "KAKATCEM.NS", "KALAMANDIR.NS", "KALYANIFRG.NS", "KALYANKJIL.NS", "KANANIIND.NS", "KANORICHEM.NS", "KARDA.NS", "KAYA.NS", "KBCGLOBAL.NS", "KCP.NS", "KCPSUGIND.NS", "KDDL.NS", "KELLTONTEC.NS", "KENNAMET.NS", "KESORAMIND.NS", "KEYCORPSER.NS", "KHAITANLTD.NS", "KHANDSE.NS", "KICL.NS", "KILITCH.NS", "KIMS.NS", "KINGFA.NS", "KIRIINDUS.NS", "KIRLOSBROS.NS", "KIRLOSIND.NS", "KITEX.NS", "KKCL.NS", "KMSUGAR.NS", "KOHINOOR.NS", "KOKUYOCMLN.NS", "KOPRAN.NS", "KOTARISUG.NS", "KOTHARIPET.NS", "KOTHARIPRO.NS", "KOVAI.NS", "KPIGREEN.NS", "KPIL.NS", "KREBSBIO.NS", "KRIDHANINF.NS", "KRISHANA.NS", "KRIVITY.NS", "KRN.NS", "KRONOX.NS", "KROSS.NS", "KRSNAA.NS", "KRYSTAL.NS", "KSHITIJPOL.NS", "KSL.NS", "KSOLVES.NS", "KUANTUM.NS", "LAGNAM.NS", "LAL.NS", "LAMBODHARA.NS", "LANCORHOL.NS", "LANDMARK.NS", "LAOPALA.NS", "LASA.NS", "LAXMICOT.NS", "LCCINFOTEC.NS", "LEXUS.NS", "LFIC.NS", "LGBBROSLTD.NS", "LGBFORGE.NS", "LIBAS.NS", "LIBERTSHOE.NS", "LICI.NS", "LIKHITHA.NS", "LINC.NS", "LINCOLN.NS", "LIQUIDBEES.NS", "LIQUIDETF.NS", "LLOYDS.NS", "LLOYDSME.NS", "LODHA.NS", "LOKESHMACH.NS", "LOTUSEYE.NS", "LOVABLE.NS", "LPDC.NS", "LRRPL.NS", "LSIL.NS", "LTF.NS", "LTFOODS.NS", "LTGILTBEES.NS", "LUMAXIND.NS", "LUMAXTECH.NS", "LYPSAGEMS.NS", "MAANALU.NS", "MACPOWER.NS", "MADHAV.NS", "MADHUCON.NS", "MADRASFERT.NS", "MAESGETF.NS", "MAGADSUGAR.NS", "MAGNUM.NS", "MAHAPEXLTD.NS", "MAHASTEEL.NS", "MAHEPCON.NS", "MAHESHWARI.NS", "MAHSCOOTER.NS", "MAITHANALL.NS", "MAJESCO.NS", "MAKARAND.NS", "MAL.NS", "MALUPAPER.NS", "MANAKALUCO.NS", "MANAKCOAT.NS", "MANAKSIA.NS", "MANAKSTEEL.NS", "MANALIPETC.NS", "MANGALAM.NS", "MANGCHEFER.NS", "MANGLURSE.NS", "MANINDS.NS", "MANINFRA.NS", "MANOMAY.NS", "MANORAMA.NS", "MANPASAND.NS", "MANUGRAPH.NS", "MANXT50.NS", "MARALOVER.NS", "MARATHON.NS", "MARINE.NS", "MARKSANS.NS", "MARSHALL.NS", "MASTEK.NS", "MATERIALS.NS", "MATHWOLL.NS", "MATRIMONY.NS", "MAWANASUG.NS", "MAXESTATES.NS", "MAXHEALTH.NS", "MAXIND.NS", "MAYURUNIQ.NS", "MCLEODRUSS.NS", "MCON.NS", "MCPHIRM.NS", "MCTV.NS", "MDH.NS", "MDL.NS", "MEDANTA.NS", "MEDICAMEQ.NS", "MEDICO.NS", "MEDPLUS.NS", "MEGAFLEX.NS", "MEGASOFT.NS", "MEGASTAR.NS", "MELSTAR.NS", "MENONBE.NS", "MEP.NS", "MERCATOR.NS", "METALFORGE.NS", "METROBRAND.NS", "METROPOLIS.NS", "MHRIL.NS", "MICEL.NS", "MICROPRO.NS", "MIDHANI.NS", "MIDCAPETF.NS", "MINDACORP.NS", "MINDTECK.NS", "MIRCELECTR.NS", "MIRZAINT.NS", "MITCON.NS", "MITTAL.NS", "MKPL.NS", "MMFL.NS", "MMP.NS", "MODIRUBBER.NS", "MODISONLTD.NS", "MOKSH.NS", "MOL.NS", "MOLDTECH.NS", "MOLDTKPAC.NS", "MONTECARLO.NS", "MORARJEE.NS", "MOREPENLAB.NS", "MOTHERSON.NS", "MOTOGENFIN.NS", "MPSLTD.NS", "MRO.NS", "MSPL.NS", "MSTCLTD.NS", "MSUMI.NS", "MTEDUCARE.NS", "MTNL.NS", "MUFIN.NS", "MUKANDLTD.NS", "MUKTAARTS.NS", "MUNJALAURO.NS", "MUNJALSHOW.NS", "MURUDCERA.NS", "MVG.NS", "MWL.NS", "MYMUDRA.NS", "NACLIND.NS", "NAGAFERT.NS", "NAGREEKCAP.NS", "NAGREEKEXP.NS", "NAHARCAP.NS", "NAHARINDUS.NS", "NAHARPOLY.NS", "NAHARSPING.NS", "NARMADA.NS", "NATHBIOGEN.NS", "NAUKRI.NS", "NAVKARCORP.NS", "NAVNETEDUL.NS", "NBIFIN.NS", "NCLIND.NS", "NCLINDUSTR.NS", "NDGL.NS", "NDL.NS", "NDRAUTO.NS", "NDTV.NS", "NECCLTD.NS", "NECLIFE.NS", "NELCAST.NS", "NELCO.NS", "NEOGEN.NS", "NEULANDLAB.NS", "NEXTMEDIA.NS", "NGIL.NS", "NGPL.NS", "NIBL.NS", "NHC.NS", "NIBE.NS", "NIDAN.NS", "NIFTYBEES.NS", "NIITLTD.NS", "NILAINFRA.NS", "NILASPACES.NS", "NIPPOBATRY.NS", "NITCO.NS", "NITINSPIN.NS", "NITIRAJ.NS", "NKIND.NS", "NOCIL.NS", "NOIDATOLL.NS", "NORBTEAEXP.NS", "NOVA.NS", "NRL.NS", "NSIL.NS", "NTL.NS", "NUCLEUS.NS", "NURECA.NS", "NUVOCO.NS", "NV20BEES.NS", "NXST.NS", "NYKAA.NS", "OAL.NS", "OBC.NS", "OCCL.NS", "OILCOUNTUB.NS", "OLECTRA.NS", "OMAXAUTO.NS", "OMFURN.NS", "OMINFRAL.NS", "ONELIFECAP.NS", "ONEPOINT.NS", "ONMOBILE.NS", "ONWARDTEC.NS", "OPTIEMUS.NS", "ORBTEXP.NS", "ORCHPHARMA.NS", "ORICONENT.NS", "ORIENTALTL.NS", "ORIENTBELL.NS", "ORIENTHOT.NS", "ORIENTLTD.NS", "ORIENTPPR.NS", "ORISSAMINE.NS", "ORTEL.NS", "ORTINLAB.NS", "OSIAHIGHPR.NS", "OSWALAGRO.NS", "OSWALGREEN.NS", "OSWALSEEDS.NS", "PAISALO.NS", "PALASHSECU.NS", "PALREDTEC.NS", "PANACEABIO.NS", "PANACHE.NS", "PANAMAPET.NS", "PANSARI.NS", "PAR.NS", "PARACABLES.NS", "PARADEEP.NS", "PARAS.NS", "PARASPETRO.NS", "PARIN.NS", "PARKHOTELS.NS", "PARSVNATH.NS", "PASUPTAC.NS", "PATANJALI.NS", "PATELENG.NS", "PATINTLOG.NS", "PAVNAIND.NS", "PAYTM.NS", "PCBL.NS", "PDMJEPAPER.NS", "PDSL.NS", "PEARLPOLY.NS", "PENIND.NS", "PENINLAND.NS", "PFC.NS", "PFOCUS.NS", "PFS.NS", "PGEL.NS", "PGIL.NS", "PHANTOMFX.NS", "PILANIINVS.NS", "PILITA.NS", "PIONDIST.NS", "PIONEEREMB.NS", "PITTIENG.NS", "PIXTRANS.NS", "PKTEA.NS", "PLASTIBLEN.NS", "PNBGILTS.NS", "PODDARMENT.NS", "POKARNA.NS", "POLYMED.NS", "POLYPLEX.NS", "POLYSPIN.NS", "PONNIERODE.NS", "POONAWALLA.NS", "POWERINDIA.NS", "POWERMECH.NS", "PPAP.NS", "PPL.NS", "PRABHAT.NS", "PRADEEP.NS", "PRAENG.NS", "PRAKASH.NS", "PRAKASHSTL.NS", "PRAMARA.NS", "PRECAM.NS", "PRECOT.NS", "PRECWIRE.NS", "PREMEXPLN.NS", "PREMIER.NS", "PREMIERPOL.NS", "PRESSTONIC.NS", "PRICOLLTD.NS", "PRIMESECU.NS", "PRINCEPIPE.NS", "PRITI.NS", "PRITIKAUTO.NS", "PRIVISCL.NS", "PROZONER.NS", "PRUDENT.NS", "PSB.NS", "PSPPROJECT.NS", "PSUBNKBEES.NS", "PTL.NS", "PUNJABCHEM.NS", "PURVA.NS", "PVP.NS", "PVRINOX.NS", "QGOLDHALF.NS", "QNIFTY.NS", "QUICKHEAL.NS", "RADAAN.NS", "RADHIKA.NS", "RADIOCITY.NS", "RAINBOW.NS", "RAJRATAN.NS", "RAJRAYON.NS", "RAJVIR.NS", "RAMANEWS.NS", "RAMASTEEL.NS", "RAMCOIND.NS", "RAMCOSYS.NS", "RAMKY.NS", "RAMRAT.NS", "RANASUG.NS", "RANEENGINE.NS", "RANEHOLDIN.NS", "RANJEEV.NS", "RANKLIN.NS", "RASHI.NS", "RATNAMANI.NS", "RBA.NS", "RBL.NS", "RECLTD.NS", "REFEX.NS", "REGENCERAM.NS", "RELCAPITAL.NS", "RELIABLE.NS", "RELIGARE.NS", "REMSONS.NS", "REPCOHOME.NS", "REPL.NS", "REPRO.NS", "RESPONIND.NS", "RETAIL.NS", "REVATHI.NS", "REXPIPES.NS", "RGL.NS", "RHETAN.NS", "RHIM.NS", "RICOAUTO.NS", "RIIL.NS", "RISHABH.NS", "RKDL.NS", "RKEC.NS", "RKSWAMY.NS", "RML.NS", "ROHLTD.NS", "ROLEXRINGS.NS", "ROLLT.NS", "ROLTA.NS", "ROML.NS", "ROSSARI.NS", "ROSSELLIND.NS", "RPGLIFE.NS", "RPPINFRA.NS", "RPPL.NS", "RPSGVENT.NS", "RPTECH.NS", "RRIL.NS", "RSWM.NS", "RSYSTEMS.NS", "RTNINDIA.NS", "RTNPOWER.NS", "RUCHIRA.NS", "RUCHINFRA.NS", "RUCHISOYA.NS", "RUSTOMJEE.NS", "RVHL.NS", "RVNL.NS", "S&SPOWER.NS", "SABEVENTS.NS", "SABTN.NS", "SADBHIN.NS", "SAFARI.NS", "SAGARDEEP.NS", "SAGCEM.NS", "SAH.NS", "SAHANA.NS", "SAHYADRI.NS", "SAKAR.NS", "SAKHTISUG.NS", "SAKSOFT.NS", "SAKUMA.NS", "SALASAR.NS", "SALONA.NS", "SALSTEEL.NS", "SAMAA.NS", "SAMHI.NS", "SAMMAANCAP.NS", "SAMBHAAV.NS", "SANCO.NS", "SANDESH.NS", "SANDHAR.NS", "SANGAMIND.NS", "SANGHIIND.NS", "SANGHVIMOV.NS", "SANGINITA.NS", "SANWARIA.NS", "SAPPHIRE.NS", "SARDAEN.NS", "SAREGAMA.NS", "SARLAPOLY.NS", "SARVESHWAR.NS", "SASKEN.NS", "SASTASUNDR.NS", "SATIA.NS", "SATIN.NS", "SBC.NS", "SBCL.NS", "SBICARD.NS", "SCAPEX.NS", "SCHAND.NS", "SCHNEIDER.NS", "SDBL.NS", "SEAMECLTD.NS", "SECL.NS", "SECURCRED.NS", "SECURKLOUD.NS", "SEJALLTD.NS", "SELAN.NS", "SELMCL.NS", "SEPC.NS", "SEQUENT.NS", "SERVOTECH.NS", "SETCO.NS", "SETUINFRA.NS", "SEYAIND.NS", "SGIL.NS", "SGL.NS", "SGS.NS", "SHAH.NS", "SHAHALIBAN.NS", "SHAILY.NS", "SHAKTIPUMP.NS", "SHALBY.NS", "SHALPAINTS.NS", "SHANTIGEAR.NS", "SHARDAMOTR.NS", "SHAREINDIA.NS", "SHEMAROO.NS", "SHIVALIK.NS", "SHIVAMILLS.NS", "SHIVATEX.NS", "SHOPERSTOP.NS", "SHRADHA.NS", "SHREDIGCEM.NS", "SHREEPUSHK.NS", "SHREERAMA.NS", "SHREMINVIT.NS", "SHRENIK.NS", "SHREYANIND.NS", "SHREYAS.NS", "SHRIRAMPPS.NS", "SHYAMCENT.NS", "SHYAMMETL.NS", "SICAL.NS", "SIGNATURE.NS", "SIGMA.NS", "SIGNET.NS", "SIKKO.NS", "SIL.NS", "SILGO.NS", "SILINV.NS", "SILLYMONKS.NS", "SILVERTUC.NS", "SIMBHALS.NS", "SIMPLEXINF.NS", "SINCLAIR.NS", "SINDHUBAD.NS", "SINTERCOM.NS", "SINTEX.NS", "SIRCA.NS", "SIS.NS", "SITINET.NS", "SIYSIL.NS", "SJS.NS", "SKIPPER.NS", "SKL.NS", "SKMEGGPLY.NS", "SKP.NS", "SKSTEXTILE.NS", "SKYGOLD.NS", "SMARTLINK.NS", "SMCGLOBAL.NS", "SMLISUZU.NS", "SMSLIFE.NS", "SMSPHARMA.NS", "SNOWMAN.NS", "SOFTTECH.NS", "SOLARA.NS", "SOLARINDS.NS", "SOMANYCERA.NS", "SOMATEX.NS", "SOMICONVEY.NS", "SONACOMS.NS", "SONAMCLOCK.NS", "SORILINFRA.NS", "SOTL.NS", "SOUTHWEST.NS", "SPAL.NS", "SPANDANA.NS", "SPECIALITY.NS", "SPENCERS.NS", "SPENTEX.NS", "SPIC.NS", "SPLIL.NS", "SPLVETF.NS", "SPORTKING.NS", "SPRL.NS", "SPYL.NS", "SREEL.NS", "SRHHYPOLTD.NS", "SRIKPRAS.NS", "SRIPIPES.NS", "SRPL.NS", "SSWL.NS", "STAMPEDE.NS", "STARCEMENT.NS", "STARHEALTH.NS", "STARPAPER.NS", "STARTECK.NS", "STCINDIA.NS", "STEELCAS.NS", "STEELCITY.NS", "STEELXIND.NS", "STEL.NS", "STERTOOLS.NS", "STLTECH.NS", "STOVEKRAFT.NS", "STYLAMIND.NS", "STYRENIX.NS", "SUBEXLTD.NS", "SUBROS.NS", "SUKHJITS.NS", "SUMEETINDS.NS", "SUMICHEM.NS", "SUMIT.NS", "SUMMITSEC.NS", "SUNDARAM.NS", "SUNDARMHLD.NS", "SUNDRMBRAK.NS", "SUNFLAG.NS", "SUPERHOUSE.NS", "SUPERPRIX.NS", "SUPREMEINF.NS", "SUPRIYA.NS", "SURAJ.NS", "SURANACORP.NS", "SURANASOL.NS", "SURANAT&P.NS", "SURYALAXMI.NS", "SURYAROSNI.NS", "SURYODAY.NS", "SUTLEJTEX.NS", "SUULD.NS", "SUVEN.NS", "SUVENPHAR.NS", "SUVIDHAA.NS", "SVLL.NS", "SVPGLOB.NS", "SWARAJENG.NS", "SWELECTES.NS", "SWITCH.NS", "SWSOLAR.NS", "SYNCOMF.NS", "SYRMA.NS", "TALBROAUTO.NS", "TALWALKARS.NS", "TAPIFRUIT.NS", "TARACHAND.NS", "TARAPUR.NS", "TARC.NS", "TARMAT.NS", "TARSONS.NS", "TATACOMM.NS", "TATATECH.NS", "TATVA.NS", "TBZ.NS", "TCI.NS", "TCIEXP.NS", "TCPLPACK.NS", "TDPOWERSYS.NS", "TECHIN.NS", "TECHNOE.NS", "TEGA.NS", "TEJASNET.NS", "TEMBO.NS", "TERASOFT.NS", "TEXINFRA.NS", "TEXMOPIPES.NS", "TEXRAIL.NS", "TFCILTD.NS", "TFL.NS", "TGBHOTELS.NS", "THANGAMAYL.NS", "THEINVEST.NS", "THEMISMED.NS", "THOMASCOTT.NS", "TIJARIA.NS", "TIL.NS", "TIMESCAN.NS", "TIMESGTY.NS", "TINPLATE.NS", "TIPSINDLTD.NS", "TIRUMALCHM.NS", "TIRUPATI.NS", "TITAGARH.NS", "TMRVL.NS", "TNPETF.NS", "TOKYOPLAST.NS", "TOLINS.NS", "TOP100CASE.NS", "TOP10CASE.NS", "TOTAL.NS", "TOUCHWOOD.NS", "TPHQ.NS", "TPLPLASTEH.NS", "TRACXN.NS", "TRANSFIN.NS", "TRANSINDIA.NS", "TRANSWORLD.NS", "TREEHOUSE.NS", "TREJHARA.NS", "TRF.NS", "TRIGYN.NS", "TRIL.NS", "TRIVENI.NS", "TRU.NS", "TTKHLTCARE.NS", "TTL.NS", "TVSELECT.NS", "TVSSRICHAK.NS", "TVVISION.NS", "UBL.NS", "UCAL.NS", "UDAICEMENT.NS", "UFO.NS", "UGARSUGAR.NS", "UGROCAP.NS", "UJJIVAN.NS", "UMAEXPORTS.NS", "UMANGDAIRY.NS", "UMESLTD.NS", "UNICHEMLAB.NS", "UNIDT.NS", "UNIENTER.NS", "UNIPARTS.NS", "UNITECH.NS", "UNITEDPOLY.NS", "UNITEDTEA.NS", "UNIVASTU.NS", "UNIVCABLES.NS", "UNIVPHOTO.NS", "UNOMINDA.NS", "URAVI.NS", "URJAGLOBAL.NS", "USHAMART.NS", "USK.NS", "UTIBANKETF.NS", "UTINEXT50.NS", "UTINIFTETF.NS", "UTISENSETF.NS", "UTKARSHBNK.NS", "UTTAMSUGAR.NS", "V2RETAIL.NS", "VADILALIND.NS", "VAIBHAVGBL.NS", "VALIANTORG.NS", "VARDHACRLC.NS", "VARDMNPOLY.NS", "VARROC.NS", "VASCONEQ.NS", "VASWANI.NS", "VCL.NS", "VENUSPIPES.NS", "VENUSREM.NS", "VERANDA.NS", "VERTOZ.NS", "VESUVIUS.NS", "VHL.NS", "VICEROY.NS", "VIDHIING.NS", "VIJAYA.NS", "VIJIFIN.NS", "VIKASECO.NS", "VIKASLIFE.NS", "VIKASPROP.NS", "VIKASWSP.NS", "VIMTALABS.NS", "VINDHYATEL.NS", "VINEETLAB.NS", "VINNY.NS", "VINYLINDIA.NS", "VIPCLOTHNG.NS", "VIPULLTD.NS", "VIRINCHI.NS", "VISAKAIND.NS", "VISASTEEL.NS", "VISHAL.NS", "VISHNU.NS", "VISHWARAJ.NS", "VIVIDHA.NS", "VIVIMEDLAB.NS", "VLSFINANCE.NS", "VOLTAMP.NS", "WALCHANNAG.NS", "WANBURY.NS", "WATERBASE.NS", "WEALTH.NS", "WEBELSOLAR.NS", "WEIZMANIND.NS", "WELENT.NS", "WELINV.NS", "WENDT.NS", "WESTLIFE.NS", "WHEELS.NS", "WINDMACHIN.NS", "WINDLAS.NS", "WINSOME.NS", "WONDERLA.NS", "WORTH.NS", "WSI.NS", "WSTCSTPAPR.NS", "XCHANGING.NS", "XPROINDIA.NS", "YAARI.NS", "YASHO.NS", "YATHARTH.NS", "YUKEN.NS", "ZAGGLE.NS", "ZEELEARN.NS", "ZENSTAINLESS.NS", "ZENITHEXPO.NS", "ZENITHSTL.NS", "ZFCVINDIA.NS", "ZIMLAB.NS", "ZODIAC.NS", "ZODIACLOTH.NS", "ZOMATO.NS", "ZOTA.NS", "ZUARI.NS", "ZUARIGLOB.NS", "ZYDUSLIFE.NS"
]));


const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

let snapshotCache: Record<string, any> = {};

export async function initSnapshotCache() {
  console.log('📦 Loading Market Snapshot from local market_snapshot.json...');
  const pathsToTry = [
    path.resolve(process.cwd(), 'market_snapshot.json'),
    path.resolve(process.cwd(), 'backend', 'market_snapshot.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../market_snapshot.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../market_snapshot.json'),
    path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../market_snapshot.json')
  ];
  let loaded = false;
  for (const p of pathsToTry) {
    if (fs.existsSync(p)) {
      console.log(`💾 Found market_snapshot.json at: ${p}`);
      try {
        const fileContent = fs.readFileSync(p, 'utf8');
        snapshotCache = JSON.parse(fileContent);
        console.log(`✅ Snapshot cache restored from local file (${Object.keys(snapshotCache).length} symbols)`);
        loaded = true;
      } catch (parseErr: any) {
        console.error(`❌ Failed to parse market_snapshot.json: ${parseErr.message}`);
      }
      break;
    }
  }
  if (loaded && snapshotCache) {
    let patched = 0;
    for (const [sym, data] of Object.entries(snapshotCache)) {
      const screener = (data as any)?.screener;
      const quotes = (data as any)?.quotes;
      if (screener && quotes && quotes.length > 0 && screener.epsHistory?.length >= 2) {
        // Only patch if scraped peMedians are NOT already available
        // Scraped "Median P/E" from screener.in uses correct historical EPS
        const hasScrapedMedians = screener.peMedians?.pe3Y > 0 || screener.peMedians?.pe5Y > 0;
        // Also force-patch if existing medians look suspicious (old broken calculation)
        // — PE > 150 for 3Y or PE > 100 for 5Y is almost certainly wrong for Indian stocks
        const hasSuspicious = hasScrapedMedians && (
          (screener.peMedians?.pe3Y > 0 && screener.peMedians.pe3Y > 150) ||
          (screener.peMedians?.pe5Y > 0 && screener.peMedians.pe5Y > 100)
        );
        if (!hasScrapedMedians || hasSuspicious) {
          const epsHistory = screener.epsHistory;
          const calc3Y = calculatePEMedianFromHistory(quotes, epsHistory, 3);
          const calc5Y = calculatePEMedianFromHistory(quotes, epsHistory, 5);
          const calc10Y = calculatePEMedianFromHistory(quotes, epsHistory, 10);
          if (calc3Y > 0 || calc5Y > 0 || calc10Y > 0) {
            if (!screener.peMedians) screener.peMedians = {};
            if (calc3Y > 0) screener.peMedians.pe3Y = calc3Y;
            if (calc5Y > 0) screener.peMedians.pe5Y = calc5Y;
            if (calc10Y > 0) screener.peMedians.pe10Y = calc10Y;
            patched++;
          }
        }
      }
    }
    if (patched > 0) console.log(`🔧 Patched peMedians for ${patched} symbols (computed from historical quotes)`);
  }

  if (!loaded) {
    console.error('❌ market_snapshot.json not found in any searched paths');
    snapshotCache = {};
  }
}

/**
 * Calculate median PE using historical annual EPS data.
 * 
 * The OLD approach divided every historical price by the current TTM EPS,
 * which gave absurdly high PEs for stocks like BAYERCROP where current
 * EPS is near zero. This new approach groups quotes by Indian financial
 * year (Apr–Mar), averages the closing price per year, then matches each
 * year with the EPS reported for that year. The median of those yearly
 * PEs is the true historical median.
 *
 * @param quotes  Array of { date, close } — daily quotes from Yahoo Finance
 * @param epsHistory  Array of annual EPS (oldest → newest) from screener.in P&L
 * @param years  How many trailing years to consider (3, 5, or 10)
 * @returns  The median yearly PE, or 0 if insufficient data
 */
function calculatePEMedianFromHistory(quotes: any[], epsHistory: number[], years: number): number {
  if (!quotes || quotes.length === 0 || !epsHistory || epsHistory.length < 2) return 0;

  // 1. Group daily quotes by Indian financial year (Apr–Mar → FY-ending year).
  //    A quote on 2024-01-15 belongs to FY 2024 (ending Mar 2024).
  //    A quote on 2024-04-01 belongs to FY 2025 (ending Mar 2025).
  const fyGroups: Record<number, number[]> = {};
  for (const q of quotes) {
    if (!q.close || !q.date) continue;
    const d = new Date(q.date);
    if (isNaN(d.getTime())) continue;
    let fyEnd = d.getFullYear();
    // Jan–Mar belongs to the *previous* FY (e.g. Jan 2024 → FY ending Mar 2024)
    if (d.getMonth() < 3) fyEnd = d.getFullYear(); // Already correct: 2024-01 → FY ending 2024
    // Apr–Dec belongs to the *current* FY (e.g. Apr 2024 → FY ending 2025)
    else fyEnd = d.getFullYear() + 1;
    if (!fyGroups[fyEnd]) fyGroups[fyEnd] = [];
    fyGroups[fyEnd].push(q.close);
  }

  // 2. Average closing price per FY
  const fyAverages: { fyEnd: number; avgPrice: number }[] = [];
  for (const [fyStr, prices] of Object.entries(fyGroups)) {
    const fyEnd = parseInt(fyStr);
    const avg = prices.reduce((a, b) => a + b, 0) / prices.length;
    fyAverages.push({ fyEnd, avgPrice: avg });
  }
  fyAverages.sort((a, b) => a.fyEnd - b.fyEnd);

  if (fyAverages.length === 0) return 0;

  // 3. Match each FY average with the corresponding EPS from epsHistory.
  //    epsHistory is stored oldest → newest. The most recent FY in our quotes
  //    maps to the *last* element of epsHistory. We work backwards.
  const yearlyPEs: number[] = [];
  const numEps = epsHistory.length;

  // We take the most recent `numEps` FYs from the quotes and match them 1:1
  // with epsHistory (oldest eps → oldest of those FYs, newest eps → newest FY).
  const recentFys = fyAverages.slice(-numEps);

  for (let i = 0; i < recentFys.length; i++) {
    const eps = epsHistory[i];
    if (!eps || eps <= 0) continue;
    const avgPrice = recentFys[i].avgPrice;
    const pe = avgPrice / eps;
    // Sanity check: reject nonsensical PE values
    if (pe > 0 && pe < 500) {
      yearlyPEs.push(pe);
    }
  }

  if (yearlyPEs.length < 2) return 0;

  // 4. Return median
  yearlyPEs.sort((a, b) => a - b);
  const mid = Math.floor(yearlyPEs.length / 2);
  const median = yearlyPEs.length % 2 !== 0
    ? yearlyPEs[mid]
    : (yearlyPEs[mid - 1] + yearlyPEs[mid]) / 2;

  return Math.round(median * 100) / 100;
}

export async function fetchScreenerData(symbol: string) {
  const cleanSymbol = symbol.split('.')[0]; 
  const urls = [
    `https://www.screener.in/company/${cleanSymbol}/consolidated/`,
    `https://www.screener.in/company/${cleanSymbol}/`
  ];
  
  let data: any = null;
  let lastError: any = null;
  
  for (const url of urls) {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        const delay = Math.random() * 2000 + 1000 + (attempt * 5000); // Increased delay
        await new Promise(resolve => setTimeout(resolve, delay));
        const response = await axios.get(url, {
          headers: { 
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Referer': 'https://www.screener.in/'
          },
          timeout: 20000
        });
        data = response.data;
        break;
      } catch (e: any) {
        lastError = e;
        if (e.response?.status === 404) break;
        if (e.response?.status === 429) {
          console.warn(`🚨 [Screener] ${cleanSymbol} hit 429 (Rate Limit), attempt ${attempt + 1}. Backing off...`);
          await new Promise(resolve => setTimeout(resolve, 10000 * (attempt + 1))); // Extra backoff for 429
          continue;
        }
        if (attempt < 4) {
          console.warn(`⚠️ [Screener] ${cleanSymbol} attempt ${attempt + 1} failed (${e.message}), retrying...`);
        }
      }
    }
    if (data) break;
  }
  
  if (!data) {
    throw new Error(lastError?.message || 'Failed to fetch screener data');
  }

  try {
    const $ = cheerio.load(data);
    const getRatio = (name: string) => {
      const el = $(`#top-ratios li`).filter(function() {
        const label = $(this).find('.name').text().trim().toLowerCase();
        return label === name.toLowerCase() || label.includes(name.toLowerCase());
      });
      const valEl = el.find('.value');
      const numberEl = valEl.find('.number');
      const rawText = numberEl.length > 0 ? numberEl.text() : valEl.text();
      const val = rawText.trim().replace(/,/g, '').replace(/[₹%]/g, '');
      const parsed = parseFloat(val);
      return isNaN(parsed) ? 0 : parsed;
    };
    const getAnnualTableData = (tableName: string, rowName: string) => {
      let section = $(`section#${tableName}`);
      if (section.length === 0) {
        section = $('section').filter(function() {
          const headerText = $(this).find('h2, h3').text().toLowerCase();
          return headerText.includes(tableName.replace('-', ' ')) || headerText.includes(tableName);
        });
      }
      const searchTerms = [rowName.toLowerCase()];
      if (rowName.toLowerCase() === 'sales') searchTerms.push('revenue', 'sales');
      if (rowName.toLowerCase() === 'net profit') searchTerms.push('net profit', 'profit after tax');

      const row = section.find(`tr`).filter(function() {
        const firstCol = $(this).find('td:first-child, th:first-child').text().trim().toLowerCase();
        return searchTerms.some(term => firstCol === term || firstCol.includes(term));
      });
      if (row.length === 0) return [];
      const values = row.find('td').map((i, el) => $(el).text().trim().replace(/,/g, '').replace(/[₹%]/g, '')).get();
      const parsed = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
      return parsed;
    };
    // Parse the "Quarterly Results" section of the Screener company page.
    // Returns an array of per-quarter objects aligned left → right (oldest → newest),
    // e.g. [{q:'Mar 2024', sales:..., opm:..., npm:..., pat:..., eps:...}, ...].
    // Screener exposes Quarterly Results under <section id="quarters"> (fallback:
    // any section whose heading contains "quarterly results"), with quarter labels
    // in the first <thead>/<tr> and metrics in the body rows.
    const getQuarterlyTableData = (): Array<{ q: string; sales: number; opm: number; npm: number; pat: number; eps: number }> => {
      let section = $('#quarters');
      if (section.length === 0) {
        section = $('section').filter(function () {
          const headerText = $(this).find('h2, h3').text().toLowerCase();
          return headerText.includes('quarterly results') || headerText.includes('quarterly');
        });
      }
      if (section.length === 0) return [];

      // Quarter labels come from the first row (thead or first tr) — pick only
      // the cells that look like "Mmm YYYY" (e.g. "Jun 2025"). This filters out
      // the "TTM" trailing column Screener sometimes appends.
      const headerCells = section.find('thead tr').first().find('th').get().length
        ? section.find('thead tr').first().find('th').get()
        : section.find('tr').first().find('th, td').get();
      const quarters: string[] = [];
      for (const cell of headerCells) {
        const txt = $(cell).text().trim();
        // Match "Jun 2025", "Jun '25", "March 2024", "Mar’24" etc.
        const m = txt.match(/^([A-Za-z]{3,9})['’]?\s*'?(\d{2,4})$/);
        if (m) {
          const monShort = m[1].slice(0, 3);
          let yr = m[2];
          if (yr.length === 2) yr = (parseInt(yr) > 50 ? '19' : '20') + yr;
          quarters.push(`${monShort} ${yr}`);
        }
      }
      if (quarters.length === 0) return [];

      // Helper to read a row of values by row name. Returns an array aligned to
      // `quarters` (NaN values become null, then we coerce non-numbers to 0).
      const readRow = (rowNames: string[]): (number | null)[] => {
        const searchTerms = rowNames.map(r => r.toLowerCase());
        const row = section.find('tr').filter(function () {
          const firstCol = $(this).find('td:first-child, th:first-child').text().trim().toLowerCase();
          return searchTerms.some(t => firstCol === t || firstCol.includes(t));
        });
        if (row.length === 0) return quarters.map(() => null);
        const cells = row.find('td').get();
        const out: (number | null)[] = [];
        for (let i = 0; i < quarters.length; i++) {
          const c = cells[i];
          if (!c) { out.push(null); continue; }
          const raw = $(c).text().trim().replace(/,/g, '').replace(/[₹%]/g, '');
          if (raw === '' || raw === '-' || raw.toLowerCase() === 'na') { out.push(null); continue; }
          const v = parseFloat(raw);
          out.push(isNaN(v) ? null : v);
        }
        return out;
      };

      const salesRow = readRow(['Sales']);
      const opmRow = readRow(['Operating Profit Margin', 'OPM']);
      const npmRow = readRow(['Net Profit Margin', 'NPM']);
      // Reported PAT first, then "Adjusted Net Profit" (Screener label) as fallback
      const patRow = readRow(['Reported Net Profit', 'Net Profit', 'Adjusted Net Profit', 'PAT']);
      const epsRow = readRow(['EPS', 'EPS in Rs']);

      const result: Array<{ q: string; sales: number; opm: number; npm: number; pat: number; eps: number }> = [];
      for (let i = 0; i < quarters.length; i++) {
        const q = quarters[i];
        const sales = salesRow[i] ?? 0;
        const opm = opmRow[i] ?? 0;
        const npm = npmRow[i] ?? 0;
        const pat = patRow[i] ?? 0;
        const eps = epsRow[i] ?? 0;
        // Skip empty tail columns (TTM etc. already filtered above; defensive)
        if (sales === 0 && opm === 0 && npm === 0 && pat === 0 && eps === 0) continue;
        result.push({ q, sales, opm, npm, pat, eps });
      }
      return result;
    };

    const getShareholdingHistory = (label: string) => {
      let history: number[] = [];
      const tables = $('#shareholding table').length > 0 ? $('#shareholding table') : $('table');
      tables.each((_, table) => {
        $(table).find('tr').each((_, row) => {
          const cells = $(row).find('td, th');
          const firstCellText = $(cells[0]).text().trim().toLowerCase();
          if (firstCellText.startsWith(label.toLowerCase()) || firstCellText.includes(label.toLowerCase())) {
            for (let k = 1; k < cells.length; k++) {
              const val = $(cells[k]).text().trim().replace(/%/g, '');
              const parsed = parseFloat(val);
              if (!isNaN(parsed)) history.push(parsed);
            }
            return false;
          }
        });
        if (history.length > 0) return false;
      });
      return history.slice(-4); 
    };

    const currentPrice = getRatio('Current Price');
    const marketCap = (getRatio('Market Cap') || getRatio('MarketCap')) * 10000000;
    let industry = 'General Research';
    const peerSector = $('#peers p.sub a[title="Sector"]').first().text().trim();
    const peerBroadIndustry = $('#peers p.sub a[title="Broad Industry"]').first().text().trim();
    const peerIndustry = $('#peers p.sub a[title="Industry"]').first().text().trim();
    
    if (peerSector) {
      industry = peerSector;
    } else if (peerBroadIndustry) {
      industry = peerBroadIndustry;
    } else if (peerIndustry) {
      industry = peerIndustry;
    } else {
      const breadcrumbText = $('.company-ratios .breadcrumb').text().trim();
      if (breadcrumbText) {
        const parts = breadcrumbText.split('\n').map(p => p.trim()).filter(p => p && p !== '/' && p.length > 2);
        if (parts.length > 0) industry = parts[parts.length - 1];
      }
    }
    const promHistory = getShareholdingHistory('Promoter') || getShareholdingHistory('Promoters');
    const fiiHistory = getShareholdingHistory('FII') || getShareholdingHistory('Foreign');
    const diiHistory = getShareholdingHistory('DII') || getShareholdingHistory('Domestic');
    // Extract promoter pledge % — Screener shows it as a row in the shareholding
    // section (e.g. "Pledged" or "Promoter Pledge"). Search #shareholding first,
    // then fall back to any table row whose label mentions "pledg".
    let pledgePct = 0;
    const pledgeRow = $('#shareholding tr').filter(function () {
      const txt = $(this).find('td:first-child, th:first-child').text().trim().toLowerCase();
      return txt.includes('pledg');
    });
    if (pledgeRow.length > 0) {
      const pledgeVal = pledgeRow.find('td').not(':first-child').first().text().trim().replace(/%/g, '');
      pledgePct = parseFloat(pledgeVal) || 0;
    } else {
      // Fallback: search all tables for a "Pledged" row
      $('table tr').each((_, row) => {
        const txt = $(row).find('td:first-child, th:first-child').text().trim().toLowerCase();
        if (txt.includes('pledg')) {
          const val = $(row).find('td').not(':first-child').first().text().trim().replace(/%/g, '');
          const parsed = parseFloat(val);
          if (!isNaN(parsed) && parsed > 0) { pledgePct = parsed; return false; }
        }
      });
    }
    const shareholding = {
      promoter: promHistory.slice(-1)[0] || 0,
      fii: fiiHistory.slice(-1)[0] || 0,
      dii: diiHistory.slice(-1)[0] || 0,
      pledged: pledgePct,
      trends: { promoter: promHistory, fii: fiiHistory, dii: diiHistory }
    };
    const smartMoneyTotal = (shareholding.promoter || 0) + (shareholding.fii || 0) + (shareholding.dii || 0);
    const netProfits = getAnnualTableData('profit-loss', 'Net Profit');
    const sales = getAnnualTableData('profit-loss', 'Sales');
    const eps = getAnnualTableData('profit-loss', 'EPS');
    
    const athSales = sales.length > 0 ? Math.max(...sales) : 0;
    const athNetProfit = netProfits.length > 0 ? Math.max(...netProfits) : 0;
    const currentSales = sales.length > 0 ? sales[sales.length - 1] : 0;
    const currentNetProfit = netProfits.length > 0 ? netProfits[netProfits.length - 1] : 0;

    const currentEPS = eps.slice(-1)[0] || (netProfits.slice(-1)[0] / 10);
    // Prefer Screener's directly-reported "Stock P/E" — it is the authoritative
    // trailing PE. Only fall back to our own currentPrice/currentEPS calculation
    // when the scraped value is missing or clearly invalid (0 or absurdly high > 500).
    // Indian stocks can legitimately have PE > 150 (e.g., consumer, pharma, high-growth).
    // We only reject if > 500 which is almost certainly a scrape error.
    const scrapedPE = getRatio('Stock P/E') || getRatio('P/E') || 0;
    const calculatedPE = currentEPS > 0 ? (currentPrice / currentEPS) : 0;
    // Use scraped PE if reasonable (0-500), otherwise fall back to calculated PE
    // Only if both are unreasonable do we use a default
    const peRatio = (scrapedPE > 0 && scrapedPE < 500)
      ? scrapedPE
      : (calculatedPE > 0 && calculatedPE < 500 ? calculatedPE : 45);

    const peMedians: any = {};
    const ratioSelectors = ['#top-ratios li', '#ratios li', '.company-ratios li', '.flex-list li', 'ul li'];
    for (const sel of ratioSelectors) {
      $(sel).each((i, el) => {
        const text = $(el).text().toLowerCase().replace(/\s+/g, ' ');
        if (text.includes('median p/e') || text.includes('median pe') || text.includes('medianp/e') || text.includes('medianpe')) {
          const valEl = $(el).find('.value, .number, span.number');
          const raw = (valEl.length > 0 ? valEl.first().text() : $(el).text().replace(/[^0-9.]/g, '')).trim().replace(/,/g, '');
          const val = parseFloat(raw);
          if (!isNaN(val) && val > 0) {
            if (text.includes('3 year') || text.includes('3 yr') || text.includes('3y') || text.includes('3years') || text.includes('3 yrs')) peMedians.pe3Y = val;
            if (text.includes('5 year') || text.includes('5 yr') || text.includes('5y') || text.includes('5years') || text.includes('5 yrs')) peMedians.pe5Y = val;
          }
        }
      });
      if (peMedians.pe3Y && peMedians.pe5Y) break;
    }

    const borrowings = getAnnualTableData('balance-sheet', 'Borrowings');
    // Screener's consolidated BS uses "Equity Capital"; standalone uses "Share Capital"
    const shareCapital = getAnnualTableData('balance-sheet', 'Share Capital')
      .concat(getAnnualTableData('balance-sheet', 'Equity Capital'));
    const reserves = getAnnualTableData('balance-sheet', 'Reserves');
    // Additional balance-sheet rows for working-capital + valuation ratios
    const inventory = getAnnualTableData('balance-sheet', 'Inventory')
      .concat(getAnnualTableData('balance-sheet', 'Inventories'));
    const debtors = getAnnualTableData('balance-sheet', 'Sundry Debtors')
      .concat(getAnnualTableData('balance-sheet', 'Trade Receivables'))
      .concat(getAnnualTableData('balance-sheet', 'Receivables'));
    const creditors = getAnnualTableData('balance-sheet', 'Sundry Creditors')
      .concat(getAnnualTableData('balance-sheet', 'Trade Payables'))
      .concat(getAnnualTableData('balance-sheet', 'Payables'));
    const cashAndBank = getAnnualTableData('balance-sheet', 'Cash')
      .concat(getAnnualTableData('balance-sheet', 'Cash & Bank'))
      .concat(getAnnualTableData('balance-sheet', 'Cash and Bank'));
    const fixedAssets = getAnnualTableData('balance-sheet', 'Fixed Assets')
      .concat(getAnnualTableData('balance-sheet', 'Property, Plant & Equipment'));
    const capitalWip = getAnnualTableData('balance-sheet', 'Capital Work in Progress')
      .concat(getAnnualTableData('balance-sheet', 'Capital WIP'))
      .concat(getAnnualTableData('balance-sheet', 'CWIP'));

    // Annual P&L rows beyond what we had — needed for OPM trend, PBT, 1Y/3Y/5Y growth
    const opmAnnual = getAnnualTableData('profit-loss', 'Operating Profit Margin')
      .concat(getAnnualTableData('profit-loss', 'OPM'));
    const pbtAnnual = getAnnualTableData('profit-loss', 'Profit Before Tax')
      .concat(getAnnualTableData('profit-loss', 'PBT'));
    const otherIncome = getAnnualTableData('profit-loss', 'Other Income');

    // Cash flow rows — Screener consolidated uses singular "Activity"
    // (e.g. "Cash from Operating Activity +"); standalone uses plural variants.
    const cfoAnnual = getAnnualTableData('cash-flow', 'Cash from Operations')
      .concat(getAnnualTableData('cash-flow', 'Cash from Operating Activity'))
      .concat(getAnnualTableData('cash-flow', 'Cash from Operating Activities'))
      .concat(getAnnualTableData('cash-flow', 'Operating Cash Flow'));
    const capexAnnual = getAnnualTableData('cash-flow', 'Capital Work in Progress')
      .concat(getAnnualTableData('cash-flow', 'Purchase of Fixed Assets'))
      .concat(getAnnualTableData('cash-flow', 'Purchase of Fixed Asset'))
      .concat(getAnnualTableData('cash-flow', 'Capex'))
      .concat(getAnnualTableData('cash-flow', 'Capital Expenditure'));
    const cfiAnnual = getAnnualTableData('cash-flow', 'Cash from Investing')
      .concat(getAnnualTableData('cash-flow', 'Cash from Investing Activity'))
      .concat(getAnnualTableData('cash-flow', 'Cash from Investing Activities'))
      .concat(getAnnualTableData('cash-flow', 'Investing Cash Flow'));
    const cffAnnual = getAnnualTableData('cash-flow', 'Cash from Financing')
      .concat(getAnnualTableData('cash-flow', 'Cash from Financing Activity'))
      .concat(getAnnualTableData('cash-flow', 'Cash from Financing Activities'))
      .concat(getAnnualTableData('cash-flow', 'Financing Cash Flow'));
    // Screener exposes "Free Cash Flow" directly as a cash-flow row — prefer it
    // over our CFO−capex approximation when available.
    const fcfAnnual = getAnnualTableData('cash-flow', 'Free Cash Flow');

    const roe = getRatio('ROE') || (getAnnualTableData('ratios', 'ROE').slice(-1)[0]) || 0;
    const roce = getRatio('ROCE') || (getAnnualTableData('ratios', 'ROCE').slice(-1)[0]) || 0;
    // Screener does NOT show "Price to Book" in top-ratios — it shows "Book Value"
    // (per share). Derive P/B = currentPrice / bookValuePS when book value is present.
    const bookValuePS = getRatio('Book Value');
    const priceToBook = (bookValuePS > 0 && currentPrice > 0)
      ? +(currentPrice / bookValuePS).toFixed(2)
      : (getRatio('Price to Book') || getRatio('P/B') || getRatio('PB') || 0);
    const evEbitda = getRatio('EV/EBITDA') || getRatio('EV EBITDA')
      || (getAnnualTableData('ratios', 'EV/EBITDA').slice(-1)[0]) || 0;
    const latestEquity = (shareCapital.slice(-1)[0] || 0) + (reserves.slice(-1)[0] || 0);
    const debtToEquity = latestEquity > 0 ? (borrowings.slice(-1)[0] / latestEquity) : 0;

    // Screener's #ratios section reports working-capital days directly as row
    // labels "Inventory Days", "Debtor Days", "Days Payable" (consolidated) —
    // prefer these over our inventory/sales×360 approximation since the BS often
    // bundles inventory/receivables/payables into "Other Assets" on consolidated pages.
    const ratiosDio = getAnnualTableData('ratios', 'Inventory Days').slice(-1)[0];
    const ratiosDso = getAnnualTableData('ratios', 'Debtor Days').slice(-1)[0]
      || getAnnualTableData('ratios', 'Receivable Days').slice(-1)[0];
    const ratiosDpo = getAnnualTableData('ratios', 'Days Payable').slice(-1)[0]
      || getAnnualTableData('ratios', 'Creditor Days').slice(-1)[0];

    // Lead time snapshots (latest annual) — guard against empty arrays
    const salesLatest = sales.slice(-1)[0] || 0;
    const cogsProxy = salesLatest; // not directly available; DIO uses annual sales as proxy denom
    const inventoryLatest = inventory.slice(-1)[0] || 0;
    const debtorsLatest = debtors.slice(-1)[0] || 0;
    const creditorsLatest = creditors.slice(-1)[0] || 0;
    const cashLatest = cashAndBank.slice(-1)[0] || 0;
    const borrowingsLatest = borrowings.slice(-1)[0] || 0;
    const fixedAssetsLatest = fixedAssets.slice(-1)[0] || 0;
    const capexLatest = capexAnnual.slice(-1)[0] || 0;
    const cfoLatest = cfoAnnual.slice(-1)[0] || 0;
    const pbtLatest = pbtAnnual.slice(-1)[0] || 0;
    const opmAnnualLatest = opmAnnual.slice(-1)[0] || 0;

    // Working-capital days proxy (roughed off annual sales × 360) — used as a
    // direction-of-travel indicator rather than a precise quarterly figure.
    const dayDenom = salesLatest > 0 ? salesLatest / 360 : 0;
    const dio = dayDenom > 0 ? Math.round(inventoryLatest / dayDenom) : null;
    const dso = dayDenom > 0 ? Math.round(debtorsLatest / dayDenom) : null;
    const dpo = dayDenom > 0 ? Math.round(creditorsLatest / dayDenom) : null;

    // Enterprise value = market cap + total debt (borrowings − cash). EBITDA
    // proxy: latest year PAT + Depreciation (we don't scrape depreciation, so use
    // CFO + tax? — instead we just stash EV value, since Screener sometimes shows
    // EV/EBITDA directly in top-ratios. If not we leave it null.)
    const ev = marketCap + ((borrowingsLatest - cashLatest) * 10000000); // borrowings stored in Cr; marketCap stored in raw ₹

    return {
      marketCap, peRatio, peMedians, dividendYield: getRatio('Dividend Yield'),
      roce, returnOnEquity: roe, netDebtToEquity: debtToEquity, currentPrice, industry,
      smartMoneyTotal, shareholding, athSales, athNetProfit, currentSales, currentNetProfit,
      athEPS: eps.length > 0 ? Math.max(...eps) : 0, currentEPS, epsHistory: eps,
      // Quarterly results table (per quarter — Sales/OPM/NPM/PAT/EPS). Empty array
      // if Screener didn't render the section (non-Indian, recent listing, etc.).
      quarterly: getQuarterlyTableData(),
      // ── Comprehensive fundamentals additions ────────────────────────────────
      annual: {
        sales, netProfit: netProfits, eps, opm: opmAnnual, pbt: pbtAnnual, otherIncome,
      },
      balanceSheet: {
        borrowings, shareCapital, reserves, inventory, debtors, creditors,
        cashAndBank, fixedAssets, capitalWip,
        latest: {
          shareCapital: shareCapital.slice(-1)[0] || 0,
          reserves: reserves.slice(-1)[0] || 0,
          borrowings: borrowingsLatest,
          inventory: inventoryLatest,
          debtors: debtorsLatest,
          creditors: creditorsLatest,
          cashAndBank: cashLatest,
          fixedAssets: fixedAssetsLatest,
          equity: latestEquity,
        },
      },
      cashFlow: {
        cfo: cfoAnnual, capex: capexAnnual, cfi: cfiAnnual, cff: cffAnnual,
        fcf: fcfAnnual,
        latest: {
          cfo: cfoLatest,
          capex: capexLatest,
          fcf: fcfAnnual.slice(-1)[0] || 0,
        },
      },
      ratios: {
        priceToBook,
        evEbitda,
        operatingMargin: opmAnnualLatest,
        pbt: pbtLatest,
        enterpriseValue: ev,
        dividendYield: getRatio('Dividend Yield'),
      },
      // Prefer Screener's directly-reported working-capital days from #ratios
      // over the inventory/sales×360 proxy (which is 0 when BS bundles cash/
      // inventory into "Other Assets" — common on consolidated pages).
      workingCapital: {
        dio: ratiosDio != null ? ratiosDio : dio,
        dso: ratiosDso != null ? ratiosDso : dso,
        dpo: ratiosDpo != null ? ratiosDpo : dpo,
      },
    };
  } catch (e: any) {
    console.error(`[SCRAPER ERROR] ${symbol}: ${e.message}`);
    return null;
  }
}

export async function runScreener() {
  console.log('🚀 [WEALTH-BASKET] Starting Dynamic Growth Audit (Cloud Mode)...');
  const results: string[] = [];
  const batchSize = 20;
  const hSuper45 = ['WHIRLPOOL', 'SANOFI', 'COLPAL', 'BATAINDIA', 'KANSAINER', 'HAVELLS', 'TCS', 'PGHH', 'BAJAJ-AUTO', 'GLAXO', 'GILLETTE', 'PAGEIND', 'AKZOINDIA', 'AMBUJACEM', 'BAJAJHLDNG', 'DABUR', 'ITC', 'HINDUNILVR', 'PFIZER', 'ABBOTINDIA', 'ICICIPRULI', 'WIPRO', 'INFY', 'NAM-INDIA', 'HCLTECH', 'ICICIGI', 'PIDILITIND', 'HDFCAMC', 'ASIANPAINT', 'BERGEPAINT', 'ULTRACEMCO', 'BAJFINANCE', 'NESTLEIND', 'ICICIBANK', 'KOTAKBANK', 'HDFCLIFE', 'BAJAJFINSV', 'AXISBANK', 'MARICO', 'TITAN', 'HDFCBANK', 'NIFTYBEES', 'BANKBEES'];
  const hGood45 = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
  const exclusions = new Set(hSuper45.concat(hGood45));
  for (let i = 0; i < BROAD_UNIVERSE.length; i += batchSize) {
    const batch = BROAD_UNIVERSE.slice(i, i + batchSize);
    await Promise.all(batch.map(async (symbol) => {
      try {
        const summary: any = await yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] });
        const annualProfit = (summary.defaultKeyStatistics?.netIncomeToCommon / 10000000) || 0;
        const debtToEquity = ((summary.financialData?.debtToEquity || 0) as number) / 100;
        const marketCapCr = (summary.summaryDetail?.marketCap || 0) / 10000000;
        if (annualProfit > 50 && debtToEquity < 0.5 && marketCapCr > 500) {
          results.push(symbol.replace('.NS', ''));
        }
      } catch (e) { }
    }));
  }
  if (supabase) {
    await supabase.from('system_cache').upsert({ key: 'dynamic_growth_basket', data: results, updated_at: new Date().toISOString() });
  }
  console.log(`✅ [WEALTH-BASKET] Growth Basket Cloud Updated (${results.length} symbols)`);
  return results;
}

export async function updateMarketSnapshot(symbols: string[]) {
  if (!Array.isArray(symbols) || symbols.length === 0) return;
  console.log(`🚀 [SNAPSHOT] Refreshing ${symbols.length} symbols to Supabase...`);
  const batchSize = 3;
  for (let i = 0; i < symbols.length; i += batchSize) {
    const batch = symbols.slice(i, i + batchSize);
    await Promise.all(batch.map(async (baseSymbol) => {
      try {
        const symbol = (baseSymbol.includes('.') || baseSymbol.startsWith('^')) ? baseSymbol : `${baseSymbol}.NS`;
        const period1 = new Date();
        period1.setFullYear(period1.getFullYear() - 20);
        const [history, quote, summary, screenerData] = await Promise.all([
          yahooFinance.chart(symbol, { period1: period1.toISOString().split('T')[0], interval: '1d' as any }),
          yahooFinance.quote(symbol),
          yahooFinance.quoteSummary(symbol, { modules: ['financialData', 'defaultKeyStatistics', 'summaryDetail'] }).catch(() => null),
          fetchScreenerData(baseSymbol).catch((e) => { console.warn(`⚠️ Screener data unavailable for ${baseSymbol}: ${e.message}`); return null; })
        ]);
        if (!history || !history.quotes) throw new Error('No history');
        const quotes = (history.quotes || []).filter((q: any) => q.close && q.low && q.high);
        const marketCap = quote.marketCap || screenerData?.marketCap || 0;
        
        // GLOBAL HARD MANDATE AUDIT
        const audit = checkInstitutionalMandates(screenerData, baseSymbol);
        
        const rawStrategies = {
          'ENVELOPE_LONG': calculateEnvelope(quotes), 'ENVELOPE_SHORT': processShortEnvelope(quotes),
          'BOLLINGER': calculateBollingerBand(quotes), '52W_HIGH_LOW': calculate52WeekStrategy(quotes),
          'CUP_HANDLE_ABCD': calculateCupHandle(quotes),
          'SMA_BCD': calculateSMAStacking(quotes), 'SR_STRATEGY': calculateSRStrategy(quotes),
          'SIXTY_SEVEN_FUNDA': calculateSixtySevenFunda(quotes, screenerData), 'TWENTY_RALLY_RETEST': calculateTwentyRallyRetest(quotes)
        };

        // If audit fails, wipe strategy signals but keep data for "Monitor" or research
        const strategies: any = {};
        Object.entries(rawStrategies).forEach(([key, res]: [string, any]) => {
          if (!audit.passed && res?.isBuyZone) {
            strategies[key] = { isBuyZone: false, status: "REJECTED", reason: audit.reasons.join(', ') };
          } else {
            strategies[key] = res;
          }
        });

        const epsHistory = screenerData?.epsHistory;
        let calc3Y = 0, calc5Y = 0, calc10Y = 0;
        if (epsHistory && epsHistory.length >= 2 && quotes.length > 0) {
          calc3Y = calculatePEMedianFromHistory(quotes, epsHistory, 3);
          calc5Y = calculatePEMedianFromHistory(quotes, epsHistory, 5);
          calc10Y = calculatePEMedianFromHistory(quotes, epsHistory, 10);
        }
        if (screenerData?.peMedians) {
          // Only fill in missing median values — don't overwrite scraped data
          if ((!screenerData.peMedians.pe3Y || screenerData.peMedians.pe3Y === 0) && calc3Y > 0) screenerData.peMedians.pe3Y = calc3Y;
          if ((!screenerData.peMedians.pe5Y || screenerData.peMedians.pe5Y === 0) && calc5Y > 0) screenerData.peMedians.pe5Y = calc5Y;
          if ((!screenerData.peMedians.pe10Y || screenerData.peMedians.pe10Y === 0) && calc10Y > 0) screenerData.peMedians.pe10Y = calc10Y;
        } else if (calc3Y > 0 || calc5Y > 0) {
          (screenerData as any) = { ...(screenerData || {}), peMedians: { pe3Y: calc3Y, pe5Y: calc5Y, pe10Y: calc10Y } };
        }

        const finalData = {
          quotes: quotes, // Full 20-year daily data from Yahoo Finance
          quote: {
            marketCap, regularMarketPrice: quote.regularMarketPrice || (quotes.length > 0 ? quotes[quotes.length - 1].close : 0),
            regularMarketChangePercent: quote.regularMarketChangePercent || 0,
            regularMarketTime: Math.floor(new Date(quote.regularMarketTime || Date.now()).getTime() / 1000),
            fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh || Math.max(...quotes.slice(-252).map(q => q.high)),
            fiftyTwoWeekLow: quote.fiftyTwoWeekLow || Math.min(...quotes.slice(-252).map(q => q.low)),
            pe: screenerData?.peRatio || summary?.summaryDetail?.trailingPE || 0,
            roe: (() => {
              let r = summary?.financialData?.returnOnEquity ?? summary?.defaultKeyStatistics?.returnOnEquity ?? 0;
              if (Math.abs(r) > 0 && Math.abs(r) < 1) r *= 100;
              return r || screenerData?.returnOnEquity || 0;
            })(),
            debtToEquity: (() => {
              let d = summary?.financialData?.debtToEquity ?? screenerData?.netDebtToEquity ?? 0;
              if (d > 1.5) d /= 100;
              return d;
            })(),
            shareholding: screenerData?.shareholding || null, beta: quote.beta
          },
          screener: screenerData, strategies, lastUpdated: new Date().toISOString()
        };
        if (supabase) {
          await supabase.from('market_data').upsert({ symbol: baseSymbol, data: finalData, updated_at: new Date().toISOString() });
        }
        snapshotCache[baseSymbol] = finalData;
      } catch (e: any) { console.error(`Snapshot failed for ${baseSymbol}: ${e.message}`); }
    }));
    await new Promise(resolve => setTimeout(resolve, 2000));
  }

  // Persist snapshot to local file so data survives server restart
  try {
    const snapshotPath = path.resolve(process.cwd(), 'market_snapshot.json');
    fs.writeFileSync(snapshotPath, JSON.stringify(snapshotCache, null, 2), 'utf-8');
    console.log(`💾 [SNAPSHOT] Persisted ${Object.keys(snapshotCache).length} symbols to disk.`);
  } catch (e: any) {
    console.error(`⚠️ [SNAPSHOT] Failed to persist snapshot to disk: ${e.message}`);
  }

  console.log(`💎 [SNAPSHOT] Success! Market data synced to Cloud.`);
}

export function initScreenerCron() {
  // Sunday 2:30 AM - Wealth basket dynamic growth audit (weekly)
  cron.schedule('30 2 * * 0', () => runScreener());

  // 6:00 PM IST - Full market snapshot update (after market close, low latency)
  cron.schedule('0 18 * * *', async () => {
    const elite = ['TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'RELIANCE', 'KOTAKBANK', 'AXISBANK', 'SBIN', 'LT', 'ITC', 'HINDUNILVR', 'ASIANPAINT', 'TITAN', 'BAJFINANCE', 'BAJAJFINSV', 'BHARTIARTL', 'M&M', 'MARUTI', 'TMCV', 'SUNPHARMA', 'DRREDDY', 'CIPLA', 'ULTRACEMCO', 'NESTLEIND', 'BRITANNIA', 'ADANIPORTS', 'ADANIENT', 'JSWSTEEL', 'TATASTEEL', 'NTPC', 'ONGC', 'POWERGRID', 'COALINDIA', 'SHRIRAMFIN', 'APOLLOHOSP', 'PIDILITIND', 'HAVELLS', 'EICHERMOT', 'NIFTYBEES', 'BANKBEES'];
    const quality = ['RELAXO', 'FINCABLES', 'SYMPHONY', 'TEAMLEASE', 'SFL', 'RAJESHEXPO', 'CERA', 'TASTYBITE', 'HONAUT', 'SIS', 'VGUARD', 'SUNTV', 'OFSS', 'BAYERCROP', 'TTKPRESTIG', 'VIPIND', 'JCHAC', 'KAJARIACER', 'VINATIORGA', 'CAPLIPOINT', 'GODREJCP', 'FINEORG', 'DIXON', 'KEI', 'ERIS', 'ASTRAZEN', 'AVANTIFEED', 'PGHL', 'LALPATHLAB', 'BOSCHLTD', 'MOTILALOFS', '3MINDIA', 'UJJIVANSFB', 'TVSMOTOR', 'HEROMOTOCO', 'RADICO', 'EICHERMOT', 'POLYCAB', 'MCX'];
    const growth = await getDynamicBasket();
    const all = elite.concat(quality, growth, ['^NSEI']);
    await updateMarketSnapshot(Array.from(new Set(all)));
  });

  // Alpha-40 institutional recalculation is scheduled in index.ts (8:30 PM IST)
  // to avoid circular dependency between screener.ts and worker.ts
}

export function getMarketSnapshot(): Record<string, any> { return snapshotCache; }
export async function getDynamicBasket(): Promise<string[]> {
  try {
    const pathsToTry = [
      path.resolve(process.cwd(), 'dynamic_basket.json'),
      path.resolve(process.cwd(), 'backend', 'dynamic_basket.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../dynamic_basket.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../dynamic_basket.json'),
      path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../../dynamic_basket.json')
    ];
    for (const p of pathsToTry) {
      if (fs.existsSync(p)) {
        const fileContent = fs.readFileSync(p, 'utf8');
        const parsed = JSON.parse(fileContent);
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (Array.isArray(parsed?.data)) {
          return parsed.data;
        }
      }
    }
  } catch (localErr: any) {
    console.warn(`⚠️ [Dynamic Basket] Local fallback failed: ${localErr.message}`);
  }

  // Final Institutional Fallback (Growth Basket Core Universe)
  const fallback = [
    "RELIANCE", "HDFCBANK", "ICICIBANK", "SBIN", "TCS", "HINDUNILVR", "INFY", "SUNPHARMA", "MARUTI", "AXISBANK",
    "KOTAKBANK", "ITC", "ONGC", "ULTRACEMCO", "HCLTECH", "BEL", "COALINDIA", "HAL", "DMART", "NESTLEIND",
    "ASIANPAINT", "HINDZINC", "WIPRO", "EICHERMOT", "VBL", "DIVISLAB", "SOLARINDS", "IDEA", "CUMMINSIND", "BSE",
    "ABB", "PIDILITIND", "TRENT", "CGPOWER", "POLYCAB", "DLF", "BANKBARODA", "TMCV", "BHEL", "SIEMENS",
    "TECHM", "UNIONBANK", "HDFCLIFE", "BRITANNIA", "CANBK", "PNB", "JINDALSTEL", "BAJAJHLDNG", "INDIANB", "CIPLA",
    "GAIL", "BOSCHLTD", "HDFCAMC", "DRREDDY", "MARICO", "AMBUJACEM", "LUPIN", "GODREJCP", "MAZDOCK", "HEROMOTOCO",
    "INDHOTEL", "SHREECEM", "OFSS", "AUROPHARMA", "NMDC", "SRF", "PERSISTENT", "IDBI", "LAURUSLABS", "SUZLON",
    "DABUR", "FEDERALBNK", "YESBANK", "FORTIS", "NATIONALUM", "AUBANK", "HAVELLS", "MCX", "NAM-INDIA", "INDUSINDBK",
    "ICICIPRULI", "DIXON", "GICRE", "BIOCON", "BANKINDIA", "NAUKRI", "IOB", "SCHAEFFLER", "ALKEM", "PHOENIXLTD",
    "IDFCFIRSTB", "GLENMARK", "MAHABANK", "TIINDIA", "LINDEINDIA", "COFORGE", "OBEROIRLTY", "BERGEPAINT", "JSL", "MFSL",
    "THERMAX", "COLPAL", "COROMANDEL", "MRF", "KEI", "HINDCOPPER", "APLAPOLLO", "RADICO", "SUPREMEIND", "MPHASIS",
    "AIAENG", "VOLTAS", "IPCALAB", "BALKRISIND", "PIIND", "ASTRAL", "PETRONET", "COCHINSHIP", "KPRMILL", "AJANTPHARM",
    "GLAXO", "WELCORP", "NAVINFLUOR", "3MINDIA", "ENDURANCE", "GODFRYPHLP", "UBL", "JBCHEPHARM", "HSCL", "CONCOR",
    "LTTS", "EXIDEIND", "TATAINVEST", "BLUESTARCO", "UCOBANK", "WOCKPHARMA", "ESCORTS", "NBCC", "HFCL", "CRISIL",
    "CENTRALBK", "TIMKEN", "TATAELXSI", "LALPATHLAB", "CDSL", "APOLLOTYRE", "ACC", "NIACL", "MTARTECH", "IGL",
    "DEEPAKNTR", "KAYNES", "TRITURBINE", "RBLBANK", "GRINDWELL", "GMDCLTD", "GESHIP", "RAMCOCEM", "KPITTECH", "PFIZER",
    "SUNTV", "CARBORUNIV", "ATUL", "BAYERCROP", "ELGIEQUIP", "GRANULES", "CAMS", "CHAMBLFERT", "REDINGTON", "VTL",
    "EIHOTEL", "SUNDRMFAST", "CHENNPETRO", "SYNGENE", "KAJARIACER", "KANSAINER", "EMAMILTD", "J&KBANK", "FINCABLES", "NATCOPHARM",
    "JINDALSAW", "DCMSHRIRAM", "GSPL", "CAPLIPOINT", "AVANTIFEED", "INOXWIND", "BASF", "FINEORG", "BEML", "APLLTD",
    "SOBHA", "ZENTEC", "GRAPHITE", "KFINTECH", "VGUARD", "VINATIORGA", "ENGINERSIN", "EIDPARRY", "ECLERX", "TRIDENT",
    "SOUTHBANK", "ZENSARTECH", "IEX", "ZEEL", "MGL", "FINPIPE", "BBTC", "SHILPAMED", "HEG", "INTELLECT",
    "RAILTEL", "MMTC", "WHIRLPOOL", "RITES", "WABAG", "KTKBANK", "CYIENT", "NCC", "PCJEWELLER", "TIMETECHNO",
    "STARCEMENT", "MAHSEAMLES", "THYROCARE", "KRBL", "SHARDACROP", "SKFINDIA", "NESCO", "GPPL", "BIRLACORPN", "GNFC",
    "JYOTHYLAB", "SONATSOFTW", "SANOFI", "TTKPRESTIG", "BAJAJCON", "CERA", "SFL", "SPARC", "TANLA", "LATENTVIEW",
    "JKPAPER", "GSFC", "GALAXYSURF", "FDC", "NEWGEN", "MOIL", "ITDC", "PTC", "IFBIND", "ICRA",
    "JAMNAAUTO", "CARERATING", "MAPMYINDIA", "BLISSGVS", "GULFOILLUB", "JUSTDIAL", "THOMASCOOK", "RALLIS", "KSCL", "VSTIND",
    "SUNTECK", "ADVENZYMES", "GHCL", "LUXIND", "KNRCON", "DBCORP", "QUESS", "ASHOKA", "RELINFRA", "ROUTE",
    "BALMLAWRIE", "DCAL", "HERITGFOOD", "RAJESHEXPO", "TEAMLEASE", "JAICORPLTD", "HATHWAY", "NILKAMAL", "DELTACORP", "JAGRAN",
    "RUPA"
  ];
  console.log(`[BASKET] getDynamicBasket returning ${fallback.length} institutional fallback symbols.`);
  return fallback;
}

