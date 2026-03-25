import { useParams } from "react-router-dom";
import Annexure1 from "./Annexure1";
import Annexure2 from "./Annexure2";

const DynamicTemplate = () => {
  const { template, userId } = useParams();

  if (template === "annexure-1") {
    return <Annexure1 userId={userId} />;
  }

  if (template === "annexure-2") {
    return <Annexure2 userId={userId} />;
  }

  return <div>Template Not Found</div>;
};

export default DynamicTemplate;