const CategoryCard = ({ name, count }) => (
  <div className="bg-white shadow rounded-lg p-4 flex justify-between items-center">
    <div className="text-lg font-semibold">{name}</div>
    <div className="text-indigo-600 font-bold">{count}</div>
  </div>
);

export default CategoryCard;