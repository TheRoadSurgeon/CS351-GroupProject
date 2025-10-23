import './Topbar.css';

function Topbar({page}) 
{
  return (
    <div id="topbar">
      <div className="topbar-content">
        <div className="page-info">
          <h1 className="page-title">{page}</h1>
        </div>

        <div className="topbar-actions">
          <div className="user-profile">
            <div className="avatar">HT</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Topbar