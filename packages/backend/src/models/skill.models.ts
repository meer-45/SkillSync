import mongoose, {
  HydratedDocument,
  Model,
  Schema,
} from "mongoose";

export type SkillFields = {
  name: string;
  category?: string;
};

export type SkillDocument = HydratedDocument<SkillFields>;
export type SkillModel = Model<SkillFields>;

const skillSchema = new Schema<SkillFields, SkillModel>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    category: String,
  },
  { timestamps: true },
);

const Skill = mongoose.model<SkillFields, SkillModel>(
  "Skill",
  skillSchema,
);

export default Skill;