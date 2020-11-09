import React, { FunctionComponent, MouseEventHandler } from 'react';

import classNames from 'classnames';
import { styled } from 'linaria/react';
import { rgba } from 'polished';

const Wrapper = styled.button`
  height: 48px;
  padding: 0 20px;

  color: #000;
  font-size: 14px;
  line-height: 140%;
  white-space: nowrap;
  text-align: center;

  background: #fff;
  border: 0;
  border-radius: 10px;

  outline: none;
  cursor: pointer;

  appearance: none;

  &.primary {
    color: #fff;

    background: #000;
  }

  &.secondary {
    color: #fff;

    background: #cecece;
  }

  &.link {
    height: auto;

    color: ${rgba('#000', 0.5)};
    font-size: 14px;
    line-height: 140%;
    text-decoration: underline;

    background: transparent;
  }

  &.small {
    height: 40px;
  }
`;

type Props = {
  primary?: boolean;
  secondary?: boolean;
  link?: boolean;
  small?: boolean;
};

export const Button: FunctionComponent<Props & React.ButtonHTMLAttributes<HTMLButtonElement>> = ({
  type = 'button',
  primary,
  secondary,
  link,
  small,
  children,
  ...props
}) => {
  return (
    <Wrapper type={type} className={classNames({ primary, secondary, link, small })} {...props}>
      {children}
    </Wrapper>
  );
};