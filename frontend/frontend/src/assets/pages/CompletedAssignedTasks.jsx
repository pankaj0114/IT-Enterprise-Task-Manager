import React from 'react';

const CompletedAssignedTasks = () => {
  return <div>CompletedAssignedTasks</div>;
};

export default CompletedAssignedTasks;

/* 

import React from 'react';

const completedTasks = tasks.filter((task) => {
  const assignedByMe =
    String(task.assignedBy?._id || task.assignedBy) === String(user?._id);

  const assignedToOther =
    String(task.assignedTo?._id || task.assignedTo) !== String(user?._id);
});

return (
  <div className="assigned-status-page">
    <div className="page-header">
      <h2>Completed Tasks</h2>

      <p>Tasks assigned by you that have been completed.</p>
    </div>

    {completedTasks.length === 0 ? (
      <div className="empty-state">
        <p>No completed tasks found.</p>
      </div>
    ) : (
      <div className="assigned-task-cards">
        {completedTasks.map((task) => (
          <div className="assigned-task-card completed-card" key={task._id}>
            <div className="task-card-header">
              <span className="status-badge completed">Completed</span>

              <span>
                Completed By:{' '}
                <strong>{task.assignedTo?.name || 'Employee'}</strong>
              </span>
            </div>

            <div className="task-field">
              <label>Title</label>
              <p>{task.title}</p>
            </div>

            <div className="task-field">
              <label>Remarks</label>
              <p>{task.remarks || 'No remarks'}</p>
            </div>

            <div className="task-field">
              <label>Issue Date</label>
              <p>
                {task.issueDate
                  ? new Date(task.issueDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>

            <div className="task-field">
              <label>Due Date</label>
              <p>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString()
                  : 'N/A'}
              </p>
            </div>

            <div className="task-field">
              <label>Priority</label>
              <p>{task.priority || 'Medium'}</p>
            </div>

            <div className="task-field">
              <label>Assigned To</label>
              <p>{task.assignedTo?.name || 'N/A'}</p>
            </div>

            <div className="task-field">
              <label>Total Time Taken</label>

              <p>
                {task.totalHours ?? 0} hours {task.totalMinutes ?? 0} minutes
              </p>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);

export default CompletedAssignedTasks;
*/
