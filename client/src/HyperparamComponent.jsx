import React, { useState } from 'react';

const HyperparamComponent = () => {

    const [hiddenLayers, setHiddenLayers] = useState('');
    const [hiddenLayerNodes, setHiddenLayerNodes] = useState('');
    const [epsilon, setEpsilon] = useState('');
    const [epsDecay, setEpsDecay] = useState('');
    const [minEps, setMinEps] = useState('');
    const [gamma, setGamma] = useState('');
    const [C, setC] = useState('');
    const [batchSize, setbatchSize] = useState('');
    const [lr, setLr] = useState('');
    const [buffer, setBuffer] = useState('');
    const [seed, setSeed] = useState('');
    const [err, setErr] = useState({msg: '', isPos: false});


    const onHiddenLayersChange = (event) => {
        setHiddenLayers(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onHiddenLayerNodesChange = (event) => {
        setHiddenLayerNodes(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onEpsilonChange = (event) => {
        setEpsilon(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onEpsDecayChange = (event) => {
        setEpsDecay(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onMinEpsChange = (event) => {
        setMinEps(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onGammaChange = (event) => {
        setGamma(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onCChange = (event) => {
        setC(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onBatchSizeChange = (event) => {
        setbatchSize(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onLrChange = (event) => {
        setLr(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onBufferChange = (event) => {
        setBuffer(event.target.value);
        setErr({msg: '', isPos: false});
    }

    const onSeedChange = (event) => {
        setSeed(event.target.value);
        setErr({msg: '', isPos: false});
    }



    const onFillDefualtClick = () => {
        setHiddenLayers(5);
        setHiddenLayerNodes(5);
        setEpsilon(0.9);
        setEpsDecay(0.999);
        setMinEps(0.1);
        setGamma(0.95);
        setC(1000);
        setbatchSize(256);
        setLr(0.001);
        setBuffer(1000000);
        setSeed(42);
        setErr({msg: '', isPos: false});
    }

    const onClearClick = () => {
        setErr({msg:'', isPos:false});
        setHiddenLayers('');
        setHiddenLayerNodes('');
        setEpsilon('');
        setEpsDecay('');
        setMinEps('');
        setGamma('');
        setC('');
        setbatchSize('');
        setLr('');
        setBuffer('');
        setSeed('');
    }

    const onSelectHyperparamClick = () => {
        if (!window.playerRunning) return;

        if (hiddenLayers==='' || !Number.isInteger(Number(hiddenLayers)) || Number(hiddenLayers)<1 || Number(hiddenLayers)>1000000) {
            setErr({'msg': 'Invalid Hidden Layers field.', isPos:false});
            return;
        }

        if (hiddenLayerNodes==='' || !Number.isInteger(Number(hiddenLayerNodes)) || Number(hiddenLayerNodes)<1 || Number(hiddenLayerNodes)>1000000) {
            setErr({'msg': 'Invalid Hidden Layer Nodes field.', isPos:false});
            return;
        }

        if (epsilon==='' || Number(epsilon)<0 || Number(epsilon)>1) {
            setErr({'msg': 'Invalid Exploration Rate field.', isPos:false});
            return;
        }

        if (epsDecay==='' || Number(epsDecay)<0 || Number(epsDecay)>1) {
            setErr({'msg': 'Invalid ε Decay Rate field.', isPos:false});
            return;
        }

        if (minEps==='' || Number(minEps)<0 || Number(minEps)>1) {
            setErr({'msg': 'Invalid Minimum ε field.', isPos:false});
            return;
        }

        if (gamma==='' || Number(gamma)<0 || Number(gamma)>1) {
            setErr({'msg': 'Invalid Discount Factor field.', isPos:false});
            return;
        }

        if (C==='' || !Number.isInteger(Number(C)) || Number(C)<1 || Number(C)>1000000) {
            setErr({'msg': 'Invalid Target Net Update Rate field.', isPos:false});
            return;
        }

        if (batchSize==='' || !Number.isInteger(Number(batchSize)) || Number(batchSize)<1 || Number(batchSize)>1000000) {
            setErr({'msg': 'Invalid Batch Size field.', isPos:false});
            return;
        }

        if (lr==='' || Number(lr)<1e-8 || Number(lr)>0.01) {
            setErr({'msg': 'Invalid Learning Rate field.', isPos:false});
            return;
        }

        if (buffer==='' || !Number.isInteger(Number(buffer)) || Number(buffer)<1000 || Number(buffer)>100000000) {
            setErr({'msg': 'Invalid Replay Buffer Size field.', isPos:false});
            return;
        }

        if (seed==='' || !Number.isInteger(Number(seed)) || Number(seed)<0 || Number(seed)>100000000) {
            setErr({'msg': 'Invalid Seed field.', isPos:false});
            return;
        }

        

        fetch('api/setHyperparams', {
            method: 'POST', 
            body: JSON.stringify({
                hiddenLayers: Number(hiddenLayers),
                hiddenLayerNodes: Number(hiddenLayerNodes), 
                epsilon: Number(epsilon),
                epsDecay: Number(epsDecay),
                minEps: Number(minEps),
                gamma: Number(gamma),
                C: Number(C),
                batchSize: Number(batchSize),
                lr: Number(lr), 
                buffer: Number(buffer), 
                seed: Number(seed),
            }), 
            headers: new Headers({'Content-Type': 'application/json'})
        })
        .then((resp) => {
            if (resp.ok) {
                setErr({msg:'Successfully updated hyperparameters.', isPos:true});
            } else {
                setErr({msg:'Failed to update hyperparameters.', isPos:false});
            }
        })
        .catch(() => setErr({msg:'Failed to update hyperparameters.', isPos:false}))
    }

    const renderErr = () => {
        if (err.msg.length===0) {
            return (<></>)
        } else {
            const style = {width: '300px', backgroundColor: (err.isPos) ? 'rgb(192,246,194)' : 'rgb(246,194,192)',
                border: '1px solid rgb(137,66,61)', borderRadius: '5px', padding: '5px' };
            return (<div style={{marginTop: '15px'}}>
                <span style={style}>{err.msg}</span>
            </div>);
        }
        
    }


    return (<div>
            <p><u>Select Hyperparameters for Deep Q-Network Training:</u></p>
            <input type='number' min='1' max='1000000' value={hiddenLayers} step='1' pattern="\d+" placeholder='# of Hidden Layers' style={{width:'130px'}} onChange={onHiddenLayersChange}/>
            <span> </span>
            <input type='number' min='1' max='1000000' value={hiddenLayerNodes} step='1' pattern="\d+" placeholder='# of Nodes per Layer' style={{width:'140px'}} onChange={onHiddenLayerNodesChange}/>
            <span> </span>
            <input type='number' min='0' max='1' value={epsilon} step='0.01' placeholder='Exploration Rate (ε)' style={{width:'135px'}} onChange={onEpsilonChange}/>
            <span> </span>
            <input type='number' min='0' max='1' value={epsDecay} step='0.01' placeholder='ε Decay Rate' style={{width:'96px'}} onChange={onEpsDecayChange}/>
            <span> </span>
            <input type='number' min='0' max='1' value={minEps} step='0.01' placeholder='Minimum ε' style={{width:'80px'}} onChange={onMinEpsChange}/>
            <span> </span>
            <input type='number' min='0' max='1' value={gamma} step='0.01' placeholder='Discount Factor (γ)' style={{width:'128px'}} onChange={onGammaChange}/>
            <span> </span>
            <input type='number' min='1' max='1000000' value={C} step='1' placeholder='Target Net Update Rate (C)' style={{width:'178px'}} onChange={onCChange}/>
            <span> </span>
            <input type='number' min='1' max='1000000' value={batchSize} step='1' placeholder='Batch Size' style={{width:'80px'}} onChange={onBatchSizeChange}/>
            <span> </span>
            <input type='number' min='1e-8' max='0.011' value={lr} step='1e-8' placeholder='Learning Rate' style={{width:'100px'}} onChange={onLrChange}/>
            <span> </span>
            <input type='number' min='1000' max='100000000' value={buffer} step='1000' placeholder='Replay Buffer Size' style={{width:'130px'}} onChange={onBufferChange}/>
            <span> </span>
            <input type='number' min='0' max='100000000' value={seed} step='1' placeholder='Seed' style={{width:'45px'}} onChange={onSeedChange}/>
            <br/>
            <br/>
            <button onClick={onFillDefualtClick}>Fill Default</button>
            <span> </span>
            <button onClick={onClearClick}>Clear</button>
            <span> </span>
            <button onClick={onSelectHyperparamClick}>Use Selected Hyperparameters</button>
            <br/>
            {renderErr()}

        </div>)
}


export default HyperparamComponent;