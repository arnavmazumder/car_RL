from flask import Flask, request
from Agent import Agent
from utils import set_seed
import joblib
import logging

app = Flask(__name__)
agent = None
isTraining = False
log = logging.getLogger('werkzeug')
log.setLevel(logging.WARNING)

MODEL_NAME = 'agent1'

# Hyperparameters
hidden_layers=5
hidden_layer_nodes=5
epsilon=0.9
eps_decay=0.999
min_eps=0.1
gamma=0.99
c=1000
batch_size=128
lr=0.001
buffer_cap=1000000
seed=42



def sanitize(isStarter, state):

    if not isinstance(state, dict): return False
    if not all(key in state for key in ('carX', 'carY', 'sineAngle', 'cosAngle', 'carSpeed', 'NE_trackDist', 'NW_trackDist', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist', 'up', 'left', 'right')): return False
    for val in ('sineAngle', 'cosAngle', 'carSpeed'): 
        if isinstance(state[val], int): state[val] = float(state[val])

    if not all(isinstance(state[val], float) for val in ('carX', 'carY', 'sineAngle', 'cosAngle', 'carSpeed', 'NE_trackDist', 'NW_trackDist', 'N_trackDist', 'S_trackDist', 'E_trackDist', 'W_trackDist')): return False
    if not all(isinstance(state[val], bool) for val in ('up', 'left', 'right')): return False

    if not isStarter:
        if not all(key in state for key in ('reward', 'done', 'isTrain')): return False
        if isinstance(state['reward'], int):
            state['reward'] = float(state['reward'])
        if not isinstance(state['reward'], float): return False
        if not all(isinstance(state[val], bool) for val in ('done', 'isTrain')): return False
        if agent is None: return False
    
    return True



    



@app.route('/api/sendState', methods=['POST'])
def receiveState():
    global agent

    # Sanitization
    state = request.get_json()
    if not sanitize(False, state): return {'msg': 'failed'}, 400


    reward = state['reward']
    done = state['done']
    isTrain = state['isTrain']
    del state['done']
    del state['reward']
    del state['isTrain']
    action = ''
        
    # Save state and reward and update agent
    if isTrain:
        agent.step(state, reward, done)

        # Produce new action
        action = agent.selectAction(state)

        # Save state and action
        agent.saveAsPrev(state, action)
    else:
        action = agent.inferAction(state)
    
    # Send back new action
    return {'action': action}




@app.route('/api/startTraining', methods=['POST'])
def startTraining():
    global agent
    global isTraining
    global hidden_layers
    global hidden_layer_nodes
    global epsilon
    global eps_decay
    global min_eps
    global gamma
    global c
    global batch_size
    global lr
    global buffer_cap
    global seed

    isTraining = True

    # Sanitization
    state = request.get_json()
    if not sanitize(True, state): return {'msg': 'failed'}, 400
    
    #initialize agent
    set_seed(seed)
    agent = Agent(num_hidden_layers=hidden_layers, hidden_layer_size=hidden_layer_nodes, epsilon=epsilon, eps_decay=eps_decay, min_eps=min_eps, gamma=gamma, targetRefreshRate=c, batch_size=batch_size, learning_rate=lr, initial_state=state, buffer_cap=buffer_cap)

    # Produce new action
    action = agent.selectAction(state)

    # Save state, action
    agent.saveAsPrev(state, action)

    print("Training Started")
    # Send back new action
    return {'action': action}




@app.route('/api/setHyperparams', methods=['POST'])
def setHyperparams():
    global hidden_layers
    global hidden_layer_nodes
    global epsilon
    global eps_decay
    global min_eps
    global gamma
    global c
    global batch_size
    global lr
    global buffer_cap
    global seed

    args = request.get_json()

    if not isinstance(args, dict): return {'msg': 'failed'}, 400
    if not all(key in args for key in ('hiddenLayers', 'hiddenLayerNodes', 'epsilon', 'epsDecay', 'minEps', 'gamma', 'C', 'batchSize', 'lr', 'buffer', 'seed')): return {'msg': 'failed'}, 400

    if args['hiddenLayers']=='' or not isinstance(args['hiddenLayers'], int) or args['hiddenLayers']<1 or args['hiddenLayers']>1000000: return {'msg': 'failed'}, 400 
    if (args['hiddenLayerNodes']=='' or not isinstance(args['hiddenLayerNodes'], int) or args['hiddenLayerNodes']<1 or args['hiddenLayerNodes']>1000000): return {'msg': 'failed'}, 400 
    if args['epsilon']=='' or args['epsilon']<0 or args['epsilon']>1: return {'msg': 'failed'}, 400 
    if args['epsDecay']=='' or args['epsDecay']<0 or args['epsDecay']>1: return {'msg': 'failed'}, 400 
    if args['minEps']=='' or args['minEps']<0 or args['minEps']>1: return {'msg': 'failed'}, 400 
    if args['gamma']=='' or args['gamma']<0 or args['gamma']>1: return {'msg': 'failed'}, 400 
    if args['C']=='' or not isinstance(args['C'], int) or args['C']<1 or args['C']>1000000: return {'msg': 'failed'}, 400 
    if args['batchSize']=='' or not isinstance(args['batchSize'], int) or args['batchSize']<1 or args['batchSize']>1000000: return {'msg': 'failed'}, 400 
    if args['lr']=='' or args['lr']<1e-8 or args['lr']>0.01: return {'msg': 'failed'}, 400 
    if args['buffer']=='' or not isinstance(args['buffer'], int) or args['buffer']<1000 or args['buffer']>100000000: return {'msg': 'failed'}, 400 
    if args['seed']=='' or not isinstance(args['seed'], int) or args['seed']<0 or args['seed']>100000000: return {'msg': 'failed'}, 400 


    hidden_layers = args['hiddenLayers']
    hidden_layer_nodes = args['hiddenLayerNodes']
    epsilon = args['epsilon']
    eps_decay = args['epsDecay']
    min_eps = args['minEps']
    gamma = args['gamma']
    c = args['C']
    batch_size = args['batchSize']
    lr = args['lr']
    buffer_cap = args['buffer']
    seed = args['seed']

    print(args)

    return {'msg': 'success'}, 200




@app.route('/api/stopTraining', methods=['POST'])
def stopTraining():
    global agent
    global isTraining
    global MODEL_NAME

    isTraining = False

    joblib.dump([agent.losses, agent.rewards, agent.replay_buffer], f'{MODEL_NAME}_data.pkl')
    agent.losses = None
    agent.rewards = None
    agent.replay_buffer = None

    joblib.dump(agent, f'{MODEL_NAME}.pkl')
    agent = None

    print("Training Stopped")
    return {'msg': 'success'}




@app.route('/api/startAI', methods=['POST'])
def startAI():
    global agent
    global MODEL_NAME

    # Sanitization
    state = request.get_json()
    if not sanitize(True, state): return {'msg': 'failed'}, 400

    agent = joblib.load(f'{MODEL_NAME}.pkl')

    newAction = agent.inferAction(state)

    print("AI Started")
    return {'action': newAction}




@app.route('/api/stopAI', methods=['POST'])
def stopAI():
    global agent
    agent = None
    print("AI Stopped")
    return {'msg': 'success'}


@app.route('/api/getMetrics')
def sendMetrics():
    global agent
    global isTraining

    if isTraining:
        return {'losses': agent.losses, 'rewards': agent.rewards}
    else:
        return {'msg': 'failed'}



if __name__== '__main__':
    app.run(host='0.0.0.0', port=8088, debug=False)

    