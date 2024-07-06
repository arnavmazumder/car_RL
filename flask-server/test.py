import joblib
from matplotlib import pyplot as plt
from Agent import Agent

agent = joblib.load('new_agent.pkl')
print(len(agent.replay_buffer))

state = {'carPosX': 
1258.765629168688, 
                'carPosY': 

396.5245088889842,
                'carSpeed': 
0.19375000000000003, 
                'sineAngle':  
 
-0.9940432021980761,
                'cosineAngle':  
 
-0.10898675223987045,
                'N_trackDist': 
1.4142135623730951, 
                'S_trackDist': 
48.9049793431733, 
                'E_trackDist':  

89.12176972551397,
                'W_trackDist':  
 
20.914164052104233}


# agent = Agent(num_hidden_layers=5, hidden_layer_size=5, epsilon=0.9, eps_decay=0.9999, min_eps=0.05, gamma=0.95, targetRefreshRate=100, batch_size=512, learning_rate=0.001, initial_state=state)


action = agent.inferAction(state)

print(action)

plt.plot(range(len(agent.losses)), agent.losses)
plt.show()
