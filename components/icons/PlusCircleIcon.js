const PlusCircleIcon = ({ width, height }) => (
  <svg
    width={width || '32'}
    height={height || '32'}
    viewBox={`0 0 ${width || '32'} ${height || '32'}`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <g clipPath="url(#clip0_790_963)">
      <path
        d="M16.0001 0.00012207C7.17768 0.00012207 0.00012207 7.17768 0.00012207 16.0001C0.00012207 24.8224 7.17768 32 16.0001 32C24.8224 32 32 24.8225 32 16.0001C32 7.17762 24.8224 0.00012207 16.0001 0.00012207ZM16.0001 30C8.2805 30 2.00012 23.7196 2.00012 16.0001C2.00012 8.2805 8.2805 2.00012 16.0001 2.00012C23.7196 2.00012 30 8.28043 30 16.0001C30 23.7196 23.7196 30 16.0001 30ZM24.8751 16.0001C24.8751 16.5524 24.4273 17.0001 23.8751 17.0001H17.0001V23.8751C17.0001 24.4274 16.5523 24.8751 16.0001 24.8751C15.4478 24.8751 15.0001 24.4274 15.0001 23.8751V17.0001H8.12506C7.57281 17.0001 7.12506 16.5524 7.12506 16.0001C7.12506 15.4477 7.57281 15.0001 8.12506 15.0001H15.0001V8.12506C15.0001 7.57275 15.4478 7.12506 16.0001 7.12506C16.5523 7.12506 17.0001 7.57275 17.0001 8.12506V15.0001H23.8751C24.4273 15.0001 24.8751 15.4478 24.8751 16.0001Z"
        fill="#9A9A9A"
      />
    </g>
    <defs>
      <clipPath id="clip0_790_963">
        <rect width="32" height="32" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

export default PlusCircleIcon;