from flask import Flask, g, jsonify, render_template, url_for, request, session, redirect
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime, timedelta
from bs4 import BeautifulSoup


from authlib.integrations.flask_client import OAuth
from werkzeug.middleware.proxy_fix import ProxyFix

app = Flask(__name__)
app.config['DEBUG'] = True
app.secret_key = 'Senhamuitodificildedescobrir123456789'
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///database.db'

app.wsgi_app = ProxyFix(
    app.wsgi_app, x_for=1, x_proto=1, x_host=1, x_prefix=1
)

oauth = OAuth(app)
db = SQLAlchemy(app)

class Aula(db.Model):
    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    Bloco = db.Column(db.String(50))
    Sala = db.Column(db.String(50))
    inicio = db.Column(db.String(10))
    fim = db.Column(db.String(10))
    Conteudo = db.Column(db.String(200))
    Responsavel = db.Column(db.String(100))
    Dia = db.Column(db.String(50))
    Vencimento = db.Column(db.String(10), nullable=True)

    def __init__(self, Bloco, Sala, inicio, fim, Conteudo, Responsavel , Dia, Vencimento=None):
        self.Bloco = Bloco
        self.Sala = Sala
        self.inicio = inicio
        self.fim = fim
        self.Conteudo = Conteudo
        self.Responsavel = Responsavel
        self.Dia = Dia
        self.Vencimento = Vencimento

class Solititacao(db.Model):
    numero_pedido = db.Column(db.Integer, primary_key=True, autoincrement=True)
    id = db.Column(db.Integer, nullable=False)
    email = db.Column(db.String(150), nullable=False)
    responsavel = db.Column(db.String(150), nullable=False)
    Bloco = db.Column(db.String(150), nullable=False)
    Sala = db.Column(db.String(150), nullable=False)
    inicio = db.Column(db.String(10), nullable=False)
    fim = db.Column(db.String(10), nullable=False)
    Dia = db.Column(db.String(45), nullable=False)
    vencimento = db.Column(db.String(10), nullable=False)
    couteudo = db.Column(db.String(150), nullable=False)
    aprovado = db.Column(db.String(20), nullable=False)

    def __init__(self, id, email, responsavel, Bloco, Sala, inicio, fim, Dia, couteudo, aprovado, vencimento):
        self.id = id
        self.email = email
        self.responsavel = responsavel
        self.Bloco = Bloco
        self.Sala = Sala
        self.inicio = inicio
        self.fim = fim
        self.Dia = Dia
        self.vencimento = vencimento
        self.couteudo = couteudo
        self.aprovado = aprovado

google = oauth.register(
    name='google',
    client_id='750588959098-l0207ls21mi5a3vo7inc5rdl9uorfjb4.apps.googleusercontent.com',
    client_secret='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',
    access_token_url='https://accounts.google.com/o/oauth2/token',
    access_token_params=None,
    authorize_url='https://accounts.google.com/o/oauth2/auth',
    authorize_params=None,
    api_base_url='https://www.googleapis.com/oauth2/v1/',
    userinfo_endpoint='https://openidconnect.googleapis.com/v1/userinfo',  # This is only needed if using openId to fetch user info
    client_kwargs={'scope': 'email profile'},
    server_metadata_url='https://accounts.google.com/.well-known/openid-configuration'
)


#GOOGLE LOGIN
@app.route('/login')
def login():
    google = oauth.create_client('google')  # create the google oauth client
    redirect_uri = url_for('authorize', _external=True)
    if google is not None:
        return google.authorize_redirect(redirect_uri)
    return ''

@app.route('/authorize')
def authorize():
    google = oauth.create_client('google')  # create the google oauth client
    if google is not None:
        token = google.authorize_access_token()  # Access token from google (needed to get user info)
        resp = google.get('userinfo')  # userinfo contains stuff u specificed in the scrope
        user_info = resp.json()
        user = google.userinfo()  # uses openid endpoint to fetch user info

        domain = user_info['email'].split('@')[1]
        if domain != 'ufrrj.br':    
            return  '<script> alert("Acesso negado: você deve usar um email @ufrrj.br.");window.location.href = "/salas/";</script>'
    

    session['profile'] = user_info
    return redirect('Consulta')

@app.route('/logout', methods=['POST', 'GET'])
def logout():
    session.pop('profile', None)
    session.pop('admin', None)
    return redirect('https://www.dcc.ufrrj.br/salas/')
#FIM GOOGLE LOGIN





#Pagina Principal
@app.route("/")
def Index():
    return render_template("Index.html")

#Parte do ADMIN
@app.route("/Confirm", methods=['POST', 'GET'])
def Confirm():
    if 'confirm' in session:
        confirmation = request.form.get('confirmation')
        if confirmation == 'yes':
            session['admin'] = session['confirm']
            session.pop('confirm', None)
            return redirect('Admin')
        
        session['profile'] = session['confirm']
        session.pop('confirm', None)
        return redirect('Profile')
    return '<script> alert("Acesso negado");window.location.href = "/logout";</script>'

#Pagina Admin
@app.route("/Admin")
def Admin():
    if 'admin' in session:
        nome = session['admin']['given_name']
        nome = nome.capitalize()
        return render_template("Admin.html", nome = nome)
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

#Mostra as solicitações
@app.route("/Solicitacoes")
def Solicitacoes():
    if 'admin' in session:
        solititacoes = Solititacao.query.all()
        nome = session['admin']['given_name']
        nome = nome.capitalize()
        return render_template("Consulta_Admin.html", users=solititacoes, nome=nome)
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

#Aprova as solicitações
@app.route("/Aprovar", methods=['POST', 'GET'])
def Aprovar():
    if 'admin' in session:
        if request.method == 'POST':
            numero_pedido = request.form.get('id')
            solicitacao = Solititacao.query.filter_by(numero_pedido=numero_pedido).first()

            if solicitacao:
                # Set all requests with the same day as not approved
                Solititacao.query.filter_by(Dia=solicitacao.Dia, Bloco=solicitacao.Bloco, Sala=solicitacao.Sala, Hora=solicitacao.Hora).update({"aprovado": 2})
                solicitacao.aprovado = 1
                db.session.commit()
            return redirect('Solicitacoes')
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

#Rejeita as solicitações
@app.route("/Rejeitar", methods=['POST', 'GET'])
def Rejeitar():
    if 'admin' in session:
        if request.method == 'POST':
            numero_pedido = request.form.get('id')
            solicitacao = Solititacao.query.filter_by(numero_pedido=numero_pedido).first()

            if solicitacao:
                solicitacao.aprovado = 2
                db.session.commit()
            return redirect('Solicitacoes')
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

#Fim Parte do ADMIN


    if 'profile' in session:
        nome = session['profile']['given_name']
        nome = nome.capitalize()
        return render_template("Profile.html", nome=nome)
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "salas/";</script>'

#Pagina Agendar
@app.route("/Agendar/", methods=['POST', 'GET'])
def Agendar():
    if 'profile' in session:

        dia = request.args.get('dia')
        bloco = request.args.get('bloco')
        
        schedule = get_schedule(dia, bloco)
        hours = [
            "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
            "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
            "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"
        ]
        rooms = sorted(schedule.keys())
        
        return render_template("Agendar.html", hours=hours, rooms=rooms, schedule=schedule)

    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

#Leva os dados para Agendar
@app.route('/agendar_sala', methods=['POST'])
def get_salas():
    if 'profile' in session:
        data = request.get_json()
        if data:
            bloco = data.get('bloco')
            dia = data.get('dia')
            vencimento = data.get('vencimento')
            sala = data.get('sala')
            inicio = data.get('inicio')
            fim = data.get('final')
            conteudo = data.get('motivo')
            email = session['profile']['email']
            responsavel = session['profile']['given_name'].capitalize()
            id = Solititacao.query.filter_by(email=email).count()+1
            solicitacao = Solititacao(id=id, email=email, responsavel=responsavel, Bloco=bloco, Sala=sala, inicio=inicio, fim=fim, Dia=dia, vencimento=vencimento, couteudo=conteudo, aprovado="Em análise")
            db.session.add(solicitacao)
            db.session.commit()
            return jsonify({"success": True})
        
        return jsonify({"Error": False})
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

#Pagina de Consulta
@app.route("/Consulta")
def Consulta():
    if 'profile' in session:

        solititacoes = get_card(session['profile']['email'])
        nome = session['profile']['given_name'].capitalize()

        return render_template("Consulta_Rework.html", solicitacoes=solititacoes, nome=nome)
    return '<script> alert("Acesso negado: você deve estar logado para acessar esta página.");window.location.href = "/salas/";</script>'

# Pagina dos blocos
@app.route("/Blocos/", methods=['POST', 'GET'])
def Blocos():
    dia = request.args.get('dia')
    bloco = request.args.get('bloco')
    print(bloco)
    
    schedule = get_schedule(dia, bloco)
    hours = [
        "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
        "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"
    ]
    rooms = sorted(schedule.keys())
    
    return render_template("schedule.html", hours=hours, rooms=rooms, schedule=schedule)

@app.route("/Slides/", methods=['POST', 'GET'])
def Slides():
    dia = request.args.get('dia')
    bloco = request.args.get('bloco')
    
    schedule = get_schedule(dia, bloco)
     
    return render_template("Slides.html", schedule=schedule)




def get_schedule(day, bloco):
    # Consulta no banco para obter as informações de cada aula
    rows = Aula.query.with_entities(
        Aula.Sala, Aula.inicio, Aula.fim, Aula.Conteudo, Aula.Responsavel
    ).filter_by(Dia=day, Bloco=bloco).all()

    # Estrutura de dados para organizar o horário
    schedule = {}
    hours = [
        "08:00-09:00", "09:00-10:00", "10:00-11:00", "11:00-12:00",
        "13:00-14:00", "14:00-15:00", "15:00-16:00", "16:00-17:00",
        "17:00-18:00", "18:00-19:00", "19:00-20:00", "20:00-21:00", "21:00-22:00"
    ]

    # Inicializa todas as salas com todos os horários como "Livre"
    salas = set(row[0] for row in rows)
    for sala in salas:
        schedule[sala] = {hour: {"main": "Livre", "details": ""} for hour in hours}

    # Processa cada linha do banco de dados e preenche o horário com o conteúdo e responsável
    for row in rows:
        sala = row.Sala
        inicio = row.inicio
        fim = row.fim
        conteudo = row.Conteudo
        responsavel = row.Responsavel
        if 'Prédio' in fim:
            print(conteudo)
        start_time = datetime.strptime(inicio, "%H:%M")
        end_time = datetime.strptime(fim, "%H:%M")

        time_slot = f"{start_time.strftime('%H:%M')}-{end_time.strftime('%H:%M')}"

            # Preenche o horário no dicionário `schedule` se o `time_slot` estiver dentro dos horários especificados
        if time_slot in hours:
            schedule[sala][time_slot] = {
                "main": conteudo,
                "details": f"Responsável: {responsavel}"
            }

        

    return schedule

def get_card(email):
    # Consulta no banco para obter as informações de cada solicitação
    rows = Solititacao.query.filter_by(email=email).all()
    cards = []
    for row in rows:
        card = {
            "Id": row.id,
            "Local": f"{row.Sala}-{row.Bloco}",
            "Horario": f"{row.inicio}-{row.fim}",
            "Conteudo": row.couteudo,
            "Dia": row.Dia,
            "Aprovado": row.aprovado
        }
        cards.append(card)
    return cards


def atualizarBD():
    soup = BeautifulSoup(open("horario/administrativo.html", "r", encoding="ISO-8859-1").read(), "html.parser")    
    green = True
    for tabela in soup.find(id='lista-turmas').find_all('tr'):

        if tabela.find('h4') is not None:
            green = True
            conteudo = tabela.h4.text
            #print(tabela.h4.text)

        tds = tabela.find_all('td')
        if len(tds) > 6 and tds[1].text != 'Nível':
            responsavel = tds[3].text
            #print(f'Professor: {tds[3].text}')
            for texto in tds[6].text.split('Bloco'):
                parts = texto.split(' ')
                if len(parts) >= 12:
                    bloco = parts[1]
                    sala = parts[4]
                    dia = parts[7]
                    inicio = parts[10]
                    fim = parts[12]
                    verificar = Aula.query.filter_by(Bloco=bloco, Sala=sala, inicio=inicio, fim=fim, Conteudo=conteudo, Responsavel=responsavel, Dia=dia).first()
                    if verificar is None:
                        aula = Aula(Bloco=bloco, Sala=sala, inicio=inicio, fim=fim, Conteudo=conteudo, Responsavel=responsavel, Dia=dia)
                        db.session.add(aula)
                        db.session.commit()
                        print(f'Aula cadastrada (Bloco: {bloco} Sala: {sala} Dia: {dia} Inicio: {inicio} Fim: {fim} Conteudo: {conteudo} Responsavel: {responsavel})')



@app.before_request
def create_tables():
    # EstaA linha remove a marcação que indica que a função create_tables seja chamada
    # a cada request, fazendo com que ela seja chamada apenas no primeiro request
    app.before_request_funcs[None].remove(create_tables)

    # Cria a base de dados
    db.create_all()

if __name__ == '__main__':
    app.run(debug=True)


# Adicionando uma linha de comnetário porque usamos a extensão liveshare para fazer o jogo ¬¬