from flask import Blueprint, render_template, request, redirect, url_for, flash, session
import json
import os
from datetime import timedelta

auth = Blueprint('auth', __name__)
USERS_FILE = os.path.join(os.path.dirname(__file__), "users.json")
CONFIG_FILE = os.path.join(os.path.dirname(__file__), "config.json")

@auth.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form.get('username')
        password = request.form.get('password')
        remember = request.form.get('remember')  

        if not os.path.exists(USERS_FILE):
            flash('Banco de usuários não encontrado.')
            return render_template('login.html')


        with open(USERS_FILE, 'r') as f:
            users = json.load(f)


        for user in users:
            if user.get("username") == username and user.get("password") == password: 
                session['username'] = username 
                session.permanent = bool(remember) 
                return redirect(url_for('routes.dashboard')) 

        flash('Usuário ou senha inválidos.')

    return render_template('login.html')

@auth.route('/logout')
def logout():
    from bot_controller import stop_bot
    session.clear()

    try:
        stop_bot()
    except Exception as e:
        pass  
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
            config['running'] = False
            with open(CONFIG_FILE, 'w') as f:
                json.dump(config, f, indent=4)
        except Exception as e:
            pass  
    return redirect(url_for('auth.login'))


    if not os.path.exists(USERS_FILE):
        flash('Banco de usuários não encontrado.')
        return render_template('login.html')


    with open(USERS_FILE, 'r') as f:
        users = json.load(f)


    for user in users:
        if user.get("username") == username and user.get("password") == password:
            session['username'] = username 
            session.permanent = bool(remember) 
            return redirect(url_for('routes.dashboard')) 
        flash('Usuário ou senha inválidos.')

    return render_template('login.html')

