import './components.css';

function Topbar({page}) 
{
  return (
    <div id="topbar">

        <div id='highlight'>
            <h1>{page}</h1>
        </div>
        
    </div>
  )
}

export default Topbar
