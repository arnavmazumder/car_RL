import matplotlib
matplotlib.use('TkAgg')
import matplotlib.pyplot as plt
import requests
import time

rewards = []
losses = []
running = True

def fetch_data():
    global rewards, losses, failed
    try:
        response = requests.get('http://localhost:8088/api/getMetrics')
        if response.status_code == 200:
            json_data = response.json()
            if 'msg' not in json_data:
                losses = json_data['losses']
                rewards = json_data['rewards']
    except Exception as e:
        print(f"Error:", e)

def on_close(event):
    global running
    print("Plot window closed.")
    running = False 

def plotMetrics():
    global rewards, losses, running 
    plt.ion()
    fig, (ax1, ax2) = plt.subplots(2, 1) 

    line1, = ax1.plot(losses)
    line2, = ax2.plot(rewards)

    ax1.set_xlabel('Frames')
    ax1.set_ylabel('Loss')
    
    ax2.set_xlabel('Episodes')
    ax2.set_ylabel('Reward')

    plt.subplots_adjust(hspace=0.5)

    fig.canvas.mpl_connect('close_event', on_close)
    plt.show(block=False)

    print('Plotting Begun.')

    while running:
        fetch_data()
        if rewards and losses:
            line1.set_ydata(losses)
            line1.set_xdata(range(1, len(losses)+1))
            ax1.relim()
            ax1.autoscale_view()

            line2.set_ydata(rewards)
            line2.set_xdata(range(1, len(rewards)+1))
            ax2.relim()
            ax2.autoscale_view()
            
            fig.canvas.draw()
            fig.canvas.flush_events()
        
        time.sleep(1)

if __name__ == '__main__':
    plotMetrics()
