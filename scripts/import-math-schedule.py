"""Read the supplied DMAT spreadsheet, preserving source text and cell references.
Usage: python3 scripts/import-math-schedule.py source.xlsx [data/directory.json]
Only the documented four-column 2026-2 format is accepted. No course assignments
are inferred. Review the resulting diff before updating an existing catalogue.
"""
import hashlib, json, pathlib, re, sys, unicodedata, zipfile
import xml.etree.ElementTree as ET

SOURCE_NAME = 'Horario Atención de Profesores 2026-2_SJ.xlsx'
NS = {'s': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
      'r': 'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
DAYS = {'lunes': 1, 'martes': 2, 'miércoles': 3, 'jueves': 4, 'viernes': 5}

def slug(text):
    return re.sub(r'[^a-z0-9]+', '-', unicodedata.normalize('NFKD', text).encode('ascii', 'ignore').decode().lower()).strip('-')

def read_rows(path):
    with zipfile.ZipFile(path) as archive:
        shared = [''.join(node.itertext()) for node in ET.fromstring(archive.read('xl/sharedStrings.xml'))] if 'xl/sharedStrings.xml' in archive.namelist() else []
        book = ET.fromstring(archive.read('xl/workbook.xml'))
        rels = {r.get('Id'): r.get('Target') for r in ET.fromstring(archive.read('xl/_rels/workbook.xml.rels'))}
        sheets = list(book.find('s:sheets', NS))
        if len(sheets) != 1: raise ValueError('Se esperaba una sola hoja; revisar el formato.')
        sheet = sheets[0]; target = rels[sheet.get('{'+NS['r']+'}id')]
        root = ET.fromstring(archive.read(target.lstrip('/') if target.startswith('/') else 'xl/'+target))
        rows = {}
        for row in root.findall('s:sheetData/s:row', NS):
            cells = {}
            for cell in row:
                value = cell.find('s:v', NS); value = value.text if value is not None else ''
                if cell.get('t') == 's': value = shared[int(value)]
                if cell.get('t') == 'inlineStr': value = ''.join(t.text or '' for t in cell.iter('{'+NS['s']+'}t'))
                if value: cells[re.sub(r'\d', '', cell.get('r'))] = re.sub(r'\s+', ' ', value).strip()
            if cells: rows[int(row.get('r'))] = cells
        if rows.get(3) != {'B':'PROFESOR DMAT','C':'HORARIO DE ATENCIÓN ALUMNOS','D':'CORREO ELECTRÓNICO','E':'OFICINA'}: raise ValueError('Encabezados no reconocidos.')
        return sheet.get('name'), rows

def convert(path):
    sheet, rows = read_rows(path)
    professors, slots = [], []
    for number, row in rows.items():
        if number < 4: continue
        if set(row) != {'B','C','D','E'}: raise ValueError(f'Fila {number}: faltan datos.')
        pid = slug(row['B']); name = row['B'].title().replace('Mª', 'Mª')
        office = row['E'].split(' ', 1)[0]
        location_note = row['E'][len(office):].strip()
        text = row['C']; matches = list(re.finditer(r'((?:(?:Lunes|Martes|Miércoles|Jueves|Viernes)(?:,\s*|\s+y\s+|\s*)?)+)\s*de\s*(\d{2}:\d{2})\s*a\s*(\d{2}:\d{2})', text, re.I))
        appointment = text.startswith('Solicitar atención')
        if not matches and not appointment: raise ValueError(f'Horario no reconocido en C{number}: {text}')
        note = ''
        if 'Avisar por correo' in text: note = 'Avisar por correo el día anterior para coordinar la atención.'
        if 'Consultas después' in text: note = 'Consultas después del taller, o por correo electrónico.'
        if 'Dudas sobre prácticas' in text: note = 'Dudas sobre prácticas: practicasj.icmat@usm.cl.'
        professors.append({'id':pid,'name':name,'departmentId':'dmat','email':row['D'],'office':office,'locationNote':location_note,'note':note,'sourceId':'dmat-sj-2026-2','sourceRow':number,'sourceSchedule':text,'sourceOffice':row['E']})
        if appointment:
            slots.append({'id':f'{pid}-coordinar','professorId':pid,'periodId':'2026-2','campusId':'san-joaquin','kind':'appointment','day':None,'start':'','end':'','location':'','note':'Solicitar atención por correo.','sourceId':'dmat-sj-2026-2','sourceRow':number})
        for match in matches:
            days = re.findall(r'Lunes|Martes|Miércoles|Jueves|Viernes', match[1], re.I)
            for day in days:
                slots.append({'id':f'{pid}-{DAYS[day.lower()]}-{match[2].replace(":", "")}','professorId':pid,'periodId':'2026-2','campusId':'san-joaquin','kind':'weekly','day':DAYS[day.lower()],'start':match[2],'end':match[3],'location':'','note':'','sourceId':'dmat-sj-2026-2','sourceRow':number})
    return {'schemaVersion':1,'updatedAt':'2026-11-14','defaultPeriodId':'2026-2',
      'sources':[{'id':'dmat-sj-2026-2','title':SOURCE_NAME,'sheet':sheet,'receivedAt':'2026-11-14','sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'note':'Nómina proporcionada por el responsable del proyecto. No informa asignaturas ni paralelos.'}],
      'periods':[{'id':'2026-2','name':'Segundo semestre 2026'}],
      'campuses':[{'id':'san-joaquin','name':'Campus San Joaquín'}],
      'departments':[{'id':'dmat','name':'Matemáticas','shortName':'DMAT'}],
      'subjects':[{'id':'mat070','code':'MAT070','name':'Introducción al Cálculo','departmentId':'dmat','calculatorId':'calculus'}, {'id':'mat061','code':'MAT061','name':'Álgebra Lineal','departmentId':'dmat','calculatorId':'algebra'}, {'id':'mat071','code':'MAT071','name':'Cálculo en una Variable','departmentId':'dmat','calculatorId':'calculus1'}],
      'professors':professors,'teachings':[],'officeHours':slots}

if __name__ == '__main__':
    source = pathlib.Path(sys.argv[1]); dest = pathlib.Path(sys.argv[2] if len(sys.argv)>2 else 'data/directory.json')
    data = convert(source); dest.parent.mkdir(parents=True,exist_ok=True)
    dest.write_text(json.dumps(data,ensure_ascii=False,indent=2)+'\n')
    print(f'{len(data["professors"])} profesores; {sum(s["kind"]=="weekly" for s in data["officeHours"])} franjas; {sum(s["kind"]=="appointment" for s in data["officeHours"])} por coordinación. Sin asignaciones de ramos inferidas.')
