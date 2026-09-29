from flask import Flask, render_template

# Inicializar aplicación Flask
app = Flask(__name__)

# Ruta principal: sirve templates/index.html
@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    print("Servidor Flask inicializado en http://localhost:5000")
    app.run(host='0.0.0.0', port=5000, debug=True)
