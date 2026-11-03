"""Importiert einen Swiss-Manager-Termin in die Daten der Jahresmeisterschaft.

Aufruf (im Hauptordner des Repositorys):
    python3 tools/import_termin.py <Tabelle_nach_Wertung.xlsx> <Kategoriepreise.xlsx|-> <TT.MM.JJJJ>

- Gegner stehen in der Swiss-Manager-Tabelle als laufende Zeilennummer (nicht Rang!); jede Paarung wird gegengeprüft.
- '-' mit 1 Punkt = spielfrei (Freilos), '-' mit 0 = in dieser Runde nicht anwesend.
- Buchholz wird direkt aus Swiss-Manager übernommen.
Hängt den Termin an data/jahresmeisterschaft-2026-27.json an (oder ersetzt ihn, wenn das Datum schon existiert).
Die Website berechnet daraus alles Weitere. Benötigt: pip install openpyxl
"""
import json, sys, openpyxl, os
DATA = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'data', 'jahresmeisterschaft-2026-27.json')
tab, kat, datum = sys.argv[1], sys.argv[2], sys.argv[3]
def sc(v): return {'1':1.0,'0':0.0,'½':0.5}.get(str(v).strip(), None)
db = json.load(open(DATA, encoding='utf-8')) if os.path.exists(DATA) else {'spieler':{}, 'termine':[]}
rows=[r for r in openpyxl.load_workbook(tab,data_only=True).active.iter_rows(values_only=True)]
hdr=[i for i,r in enumerate(rows) if r[0]=='Rg.'][0]
players=[r for r in rows[hdr+1:] if isinstance(r[1],(int,float))]
nrd=sum(1 for c in rows[hdr] if c and str(c).endswith('Rd.'))
rank={}; last=None
for r in players:
    if r[0] is not None: last=int(r[0])
    rank[int(r[1])]=last
row={int(r[1]):r for r in players}
pos={int(r[1]):i+1 for i,r in enumerate(players)}   # Gegnernummer = Zeilenposition in der Tabelle
def opp(r,k): return str(r[5+3*k]).strip()
def resolve(snr,k):
    o=int(players[int(opp(row[snr],k))-1][1])
    assert opp(row[o],k)==str(pos[snr]), ('Gegenpaarung passt nicht',snr,k)   # Symmetrie-Prüfung
    return o
cats={}
if kat!='-':
    for r in openpyxl.load_workbook(kat,data_only=True).active.iter_rows(values_only=True):
        if isinstance(r[1],(int,float)) and r[4]: cats[int(r[1])]=str(r[4]).strip()
term={'datum':datum,'ergebnisse':{}}
for r in players:
    snr=int(r[1]); name=r[2].strip()
    sp=db['spieler'].setdefault(name,{'kat':None})
    if cats.get(snr): sp['kat']=cats[snr]
    if r[3]: sp['elo']=int(r[3])
    rds=[]
    for k in range(nrd):
        o,f,p=r[5+3*k:8+3*k]
        if str(o).strip()=='-':
            rds.append({'gegner':None,'spielfrei':sc(p)==1.0,'punkte':sc(p)}); continue
        rds.append({'gegner':row[resolve(snr,k)][2].strip(),'farbe':f,'punkte':sc(p)})
    gespielt=any(x['gegner'] or x.get('spielfrei') for x in rds)
    term['ergebnisse'][name]={'rang':rank[snr] if gespielt else None,'runden':rds if gespielt else [],
                              'pkte_swiss':str(r[23]),'bh_swiss':str(r[24]).replace(',','.')}
db['termine']=[t for t in db['termine'] if t['datum']!=datum]+[term]
db['termine'].sort(key=lambda t: t['datum'][6:]+t['datum'][3:5]+t['datum'][:2])
json.dump(db,open(DATA,'w',encoding='utf-8'),ensure_ascii=False,indent=1)
print('ok',datum,sum(1 for e in term['ergebnisse'].values() if e['rang']),'anwesend')
